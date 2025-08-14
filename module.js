// fvtt-chat-pruner — GM-only chat pruning tool (v11–v13) — Application (v1) only
const MOD = "fvtt-chat-pruner";

/** Safely strip HTML to plain text across FVTT versions/browsers */
function stripHTMLSafe(input) {
  const html = String(input ?? "");
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  return text;
}

/** Defensive can-delete check across versions */
function canDeleteMessage(msg, user) {
  try {
    if (user?.isGM) return true;
    if (typeof msg?.canUserModify === "function") return msg.canUserModify(user, "delete");
    if ("isOwner" in msg) return !!msg.isOwner;
  } catch (e) { /* ignore */ }
  return false;
}

/** Cross-version bulk delete */
async function deleteMessagesByIds(ids) {
  const coll = game.messages;
  if (coll && typeof coll.deleteDocuments === "function") {
    return coll.deleteDocuments(ids);
  }
  if (typeof ChatMessage?.deleteDocuments === "function") {
    return ChatMessage.deleteDocuments(ids);
  }
  // Fallback: delete one-by-one
  for (const id of ids) {
    const m = game.messages.get(id);
    if (m && typeof m.delete === "function") {
      // eslint-disable-next-line no-await-in-loop
      await m.delete();
    }
  }
}

Hooks.once("init", async () => {
  await loadTemplates([`modules/${MOD}/templates/chat-pruner.hbs`]);
});

Hooks.once("ready", () => {
  const mod = game.modules.get(MOD);
  if (mod) {
    mod.api = { open: () => ChatPrunerApp.open() };
  }
  console.log(`${MOD} | Ready. Create a Macro with: game.modules.get('${MOD}')?.api?.open()`);
});

class ChatPrunerApp extends Application {
  static open() {
    if (!game.user?.isGM) {
      ui.notifications?.warn?.("Chat Pruner is GM-only.");
      return;
    }
    const existing = Object.values(ui.windows).find((w) => w instanceof ChatPrunerApp);
    if (existing) return existing.bringToTop();
    new ChatPrunerApp().render(true);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MOD}-window`,
      title: "Chat Pruner",
      template: `modules/${MOD}/templates/chat-pruner.hbs`,
      width: 840,
      height: 680,
      resizable: true,
      classes: [MOD], // => .fvtt-chat-pruner
    });
  }

  getData() {
    const rows = this._getLastMessages(200);
    return { rows, count: rows.length };
  }

  _getLastMessages(limit) {
    const all = game.messages?.contents ?? [];
    // oldest → newest for anchor logic
    const slice = all.slice(-limit).sort((a, b) => (a?.timestamp ?? 0) - (b?.timestamp ?? 0));
    return slice.map((m) => {
      const ts = m?.timestamp ?? m?._source?.timestamp ?? 0;
      const when = ts ? new Date(ts).toLocaleString() : "";
      const speaker = m?.speaker?.alias || m?.speaker?.actor || "—";
      const user = m?.user?.name ?? "Unknown";
      return {
        id: m?.id,
        when,
        ts,
        user,
        speaker,
        content: this._summarize(m),
        canDelete: canDeleteMessage(m, game.user),
      };
    });
  }

  _summarize(msg) {
    const html = msg?.flavor || msg?.content || "";
    const text = stripHTMLSafe(html);
    return text.length > 160 ? text.slice(0, 157) + "…" : (text || "(empty)");
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Row click toggles the checkbox unless clicking on controls
    html.find(".pruner-row").on("click", (ev) => {
      if (["INPUT", "BUTTON", "LABEL", "A"].includes(ev.target.tagName)) return;
      const $row = $(ev.currentTarget);
      const $cb = $row.find("input.sel[type=checkbox]");
      if ($cb.is(":enabled")) {
        $cb.prop("checked", !$cb.prop("checked")).trigger("change");
      }
    });

    // Select all
    html.find("#pruner-select-all").on("change", (ev) => {
      const checked = ev.currentTarget.checked;
      html.find("input.sel[type=checkbox]:enabled").prop("checked", checked).trigger("change");
    });

    // Visual highlight when a row is selected
    html.find("input.sel[type=checkbox]").on("change", (ev) => {
      const $row = $(ev.currentTarget).closest(".pruner-row");
      $row.toggleClass("is-selected", ev.currentTarget.checked);
    });

    // Buttons
    html.find("[data-action=deleteSelected]").on("click", () => this._deleteSelected(html));
    html.find("[data-action=deleteNewer]").on("click", () => this._deleteNewerThanAnchor(html));
    html.find("[data-action=deleteOlder]").on("click", () => this._deleteOlderThanAnchor(html));
    html.find("[data-action=refresh]").on("click", () => this.render(true));
    html.find("[data-action=about]").on("click", () => this._about());

    // Tooltip: follow mouse showing full content (from data-full attr)
    const $tooltip = html.find("#cp-tooltip");
    // Ensure tooltip exists even if the template was customized
    if (!$tooltip.length) {
      html.append('<div id="cp-tooltip"></div>');
    }
    const tooltip = html.find("#cp-tooltip");
    const OFFSET = 16;

    function positionTooltip(ev) {
      // Basic edge-avoidance: nudge left/up if near right/bottom
      const tip = tooltip.get(0);
      if (!tip) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const rect = tip.getBoundingClientRect();
      let left = ev.clientX + OFFSET;
      let top = ev.clientY + OFFSET;
      if (left + rect.width + 8 > vw) left = ev.clientX - rect.width - OFFSET;
      if (top + rect.height + 8 > vh) top = ev.clientY - rect.height - OFFSET;
      tooltip.css({ left, top });
    }

    html.find(".cell.content").each(function () {
      const $el = $(this);
      const fullText = $el.attr("data-full") || $el.attr("title") || $el.text();
      if (!fullText) return;

      $el
        .on("mouseenter", function () {
          tooltip.text(fullText).addClass("show");
        })
        .on("mousemove", function (ev) {
          positionTooltip(ev);
        })
        .on("mouseleave", function () {
          tooltip.removeClass("show");
        });
    });
  }

  async _deleteSelected(html) {
    const ids = html.find("input.sel[type=checkbox]:checked").map((_, el) => el.value).get();
    if (!ids.length) return ui.notifications?.warn?.("No messages selected.");

    const ok = await Dialog.confirm({
      title: "Delete Selected Messages",
      content: `<p>Delete ${ids.length} selected message(s)? This cannot be undone.</p>`,
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteNewerThanAnchor(html) {
    const anchorId = html.find("input.anchor[type=radio]:checked").val();
    if (!anchorId) return ui.notifications?.warn?.("Choose an anchor message first.");

    const rows = this._getLastMessages(200); // oldest → newest
    const idx = rows.findIndex((r) => r.id === anchorId);
    if (idx === -1) return ui.notifications?.error?.("Anchor message not found.");

    const newer = rows.slice(idx + 1);
    const ids = newer.filter((r) => r.canDelete).map((r) => r.id);
    const blocked = newer.filter((r) => !r.canDelete).length;

    if (!ids.length) return ui.notifications?.info?.("No deletable messages newer than the selected anchor.");

    const ok = await Dialog.confirm({
      title: "Delete Newer Than Anchor",
      content: `<p>Delete ${ids.length} newer message(s) than the selected anchor? ${blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""}</p>`,
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteOlderThanAnchor(html) {
    const anchorId = html.find("input.anchor[type=radio]:checked").val();
    if (!anchorId) return ui.notifications?.warn?.("Choose an anchor message first.");

    const rows = this._getLastMessages(200); // oldest → newest
    const idx = rows.findIndex((r) => r.id === anchorId);
    if (idx === -1) return ui.notifications?.error?.("Anchor message not found.");

    const older = rows.slice(0, idx);
    const ids = older.filter((r) => r.canDelete).map((r) => r.id);
    const blocked = older.filter((r) => !r.canDelete).length;

    if (!ids.length) return ui.notifications?.info?.("No deletable messages older than the selected anchor.");

    const ok = await Dialog.confirm({
      title: "Delete Older Than Anchor",
      content: `<p>Delete ${ids.length} older message(s) than the selected anchor? ${blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""}</p>`,
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteByIds(ids) {
    const deletable = ids.filter((id) => {
      const m = game.messages.get(id);
      return m && canDeleteMessage(m, game.user);
    });

    if (!deletable.length) return ui.notifications?.error?.("You don't have permission to delete the selected messages.");

    try {
      await deleteMessagesByIds(deletable);
      ui.notifications?.info?.(`Deleted ${deletable.length} message(s).`);
      this.render(true);
    } catch (err) {
      console.error(`${MOD} | delete failed`, err);
      ui.notifications?.error?.("Some messages could not be deleted. See console for details.");
    }
  }

  _about() {
    new Dialog({
      title: "About Chat Pruner",
      content: `<p><strong>Chat Pruner</strong> (GM-only). View last 200 chat messages; delete selected; or delete newer/older than an anchor.</p>
                <p>Compatible with Foundry VTT v11–v13. UI uses Application (v1) only.</p>`,
      buttons: { ok: { label: "OK" } },
    }).render(true);
  }
}
