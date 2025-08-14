// fvtt-chat-pruner — GM-only chat pruning tool (v11–v13) — Application (v1) only
const MOD = "fvtt-chat-pruner";

Hooks.once("init", async () => {
  await loadTemplates([`modules/${MOD}/templates/chat-pruner.hbs`]);
});

Hooks.once("ready", () => {
  // Expose a tiny API for the macro
  game.modules.get(MOD).api = {
    open: () => ChatPrunerApp.open(),
  };
  console.log(`${MOD} | Ready. Create a Macro with: game.modules.get('${MOD}')?.api?.open()`);
});

class ChatPrunerApp extends Application {
  static open() {
    if (!game.user?.isGM) {
      ui.notifications.warn("Chat Pruner is GM-only.");
      return;
    }
    const existing = Object.values(ui.windows).find(w => w instanceof ChatPrunerApp);
    if (existing) return existing.bringToTop();
    new ChatPrunerApp().render(true);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MOD}-window`,
      title: "Chat Pruner",
      template: `modules/${MOD}/templates/chat-pruner.hbs`,
      width: 780,
      height: 640,
      resizable: true,
      classes: [MOD],
    });
  }

  getData(options) {
    const rows = this._getLastMessages(200);
    return { rows, count: rows.length };
  }

  _getLastMessages(limit) {
    const all = game.messages?.contents ?? [];
    // oldest → newest (needed for "after anchor")
    const slice = all.slice(-limit).sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    return slice.map(m => {
      const ts = m.timestamp ?? m._source?.timestamp ?? 0;
      const when = ts ? new Date(ts).toLocaleString() : "";
      const canDelete = game.user.isGM || m.canUserModify?.(game.user, "delete");
      const speaker = m.speaker?.alias || m.speaker?.actor || "—";
      const user = m.user?.name ?? "Unknown";
      return {
        id: m.id,
        when,
        ts,
        user,
        speaker,
        content: this._summarize(m),
        canDelete,
      };
    });
  }

  _summarize(msg) {
    const html = msg.flavor || msg.content || "";
    const text = foundry.utils.stripHTML(html ?? "").replace(/\s+/g, " ").trim();
    return text.length > 160 ? text.slice(0, 157) + "…" : (text || "(empty)");
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Row click toggles the checkbox unless clicking on controls
    html.find(".pruner-row").on("click", (ev) => {
      if (["INPUT", "BUTTON", "LABEL", "A"].includes(ev.target.tagName)) return;
      const $row = $(ev.currentTarget);
      const $cb = $row.find("input.sel[type=checkbox]");
      if ($cb.is(":enabled")) $cb.prop("checked", !$cb.prop("checked"));
    });

    // Select all
    html.find("#pruner-select-all").on("change", (ev) => {
      const checked = ev.currentTarget.checked;
      html.find("input.sel[type=checkbox]:enabled").prop("checked", checked);
    });

    // Buttons
    html.find("[data-action=deleteSelected]").on("click", () => this._deleteSelected(html));
    html.find("[data-action=deleteAfter]").on("click", () => this._deleteAfterAnchor(html));
    html.find("[data-action=refresh]").on("click", () => this.render(true));
    html.find("[data-action=about]").on("click", () => this._about());
  }

  async _deleteSelected(html) {
    const ids = html.find("input.sel[type=checkbox]:checked").map((_, el) => el.value).get();
    if (!ids.length) return ui.notifications.warn("No messages selected.");

    const ok = await Dialog.confirm({
      title: "Delete Selected Messages",
      content: `<p>Delete ${ids.length} selected message(s)? This cannot be undone.</p>`
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteAfterAnchor(html) {
    const anchorId = html.find("input.anchor[type=radio]:checked").val();
    if (!anchorId) return ui.notifications.warn("Choose an anchor message first.");

    const rows = this._getLastMessages(200); // oldest → newest
    const idx = rows.findIndex(r => r.id === anchorId);
    if (idx === -1) return ui.notifications.error("Anchor message not found.");

    const after = rows.slice(idx + 1);
    const ids = after.filter(r => r.canDelete).map(r => r.id);
    const blocked = after.filter(r => !r.canDelete).length;

    if (!ids.length) return ui.notifications.info("No deletable messages after the selected anchor.");

    const ok = await Dialog.confirm({
      title: "Delete Messages After Anchor",
      content: `<p>Delete ${ids.length} message(s) after the anchor? ${blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""}</p>`
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteByIds(ids) {
    // Extra safety: GM-only UI, but keep per-message permission check
    const deletable = ids.filter(id => {
      const m = game.messages.get(id);
      return m && (game.user.isGM || m.canUserModify?.(game.user, "delete"));
    });
    if (!deletable.length) return ui.notifications.error("You don't have permission to delete the selected messages.");

    try {
      await game.messages.deleteDocuments(deletable);
      ui.notifications.info(`Deleted ${deletable.length} message(s).`);
      this.render(true);
    } catch (err) {
      console.error(`${MOD} | delete failed`, err);
      ui.notifications.error("Some messages could not be deleted. See console for details.");
    }
  }

  _about() {
    new Dialog({
      title: "About Chat Pruner",
      content: `<p><strong>Chat Pruner</strong> (GM-only). View last 200 chat messages, select to delete, or delete all after an anchor.</p>
                <p>Compatible with Foundry VTT v11–v13. UI uses Application (v1) only.</p>`,
      buttons: { ok: { label: "OK" } }
    }).render(true);
  }
}
