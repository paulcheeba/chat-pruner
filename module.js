// fvtt-chat-pruner — GM-only chat pruning tool (v11–v13)
// Main UI: DialogV2 (ApplicationV2); About window: Application (v1)
const MOD = "fvtt-chat-pruner";

Hooks.once("init", async () => {
  console.log(`${MOD} | init`);
  await loadTemplates([`modules/${MOD}/templates/chat-pruner.hbs`]);

  // Tiny legacy Application v1 used for the About window
  class PrunerAboutV1 extends Application {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MOD}-about`,
        title: "About — Chat Pruner",
        template: false,
        width: 420, height: "auto", resizable: true
      });
    }
    async _render(force, options) {
      await super._render(force, options);
      const el = this.element;
      el.html(`
        <section class="window-content">
          <h2>Chat Pruner</h2>
          <p>GM-only chat management utility. View the last 200 chat messages, multi-select to delete, or choose an anchor message and delete everything after it.</p>
          <p>UI built with DialogV2 (ApplicationV2). This window is a legacy Application (v1) example.</p>
          <p>Compatible with Foundry VTT v11–v13.</p>
        </section>
      `);
    }
  }

  // expose v1 window via api
  game.modules.get(MOD).api = { PrunerAboutV1 };
});

Hooks.once("ready", () => {
  console.log(`${MOD} | ready`);
});

// Inject a single GM-only button under the chat input
Hooks.on("renderChatLog", (app, html) => {
  if (!game.user.isGM) return;                       // GM-only
  if (html.find(`#${MOD}-open`).length) return;      // avoid duplicates

  const form = html.find("#chat-form");
  if (!form.length) return;

  const $open = $(`<button id="${MOD}-open" type="button" class="${MOD}-btn">Manage Chat</button>`);
  form.after($open);
  $open.on("click", () => ChatPrunerDialog.show());
});

class ChatPrunerDialog extends DialogV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MOD}-dialog`,
      classes: [MOD],
      window: { title: "Chat Pruner", icon: "fas fa-broom" },
      position: { width: 760, height: 620 }
    });
  }

  static _getLastMessages(limit = 200) {
    const all = game.messages?.contents ?? [];
    const slice = all.slice(-limit);
    // oldest → newest
    const sorted = slice.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    return sorted.map(m => {
      const ts = m.timestamp ?? m._source?.timestamp ?? 0;
      const when = ts ? new Date(ts).toLocaleString() : "";
      const content = ChatPrunerDialog._summarize(m);
      const canDelete = m.canUserModify(game.user, "delete") || game.user.isGM;
      const speaker = m.speaker?.alias || m.speaker?.actor || "—";
      const user = m.user?.name ?? "Unknown";
      const type = m.type ?? m._source?.type ?? "";
      return { id: m.id, ts, when, user, speaker, type, content, canDelete };
    });
  }

  static _summarize(message) {
    const html = message.flavor || message.content || "";
    const text = foundry.utils.stripHTML(html ?? "").replace(/\s+/g, " ").trim();
    return text.length > 160 ? text.slice(0, 157) + "…" : (text || "(empty)");
  }

  static async show() {
    const rows = ChatPrunerDialog._getLastMessages(200);
    const content = await renderTemplate(`modules/${MOD}/templates/chat-pruner.hbs`, { rows });

    const dlg = new ChatPrunerDialog({
      content,
      buttons: [
        {
          action: "deleteSelected",
          label: "Delete Selected",
          icon: "fas fa-trash",
          default: true,
          callback: (event, button, dialog) => dialog._deleteSelected()
        },
        {
          action: "deleteAfter",
          label: "Delete After Anchor",
          icon: "fas fa-forward",
          callback: (event, button, dialog) => dialog._deleteAfterAnchor()
        },
        {
          action: "about",
          label: "About",
          icon: "fas fa-info-circle",
          callback: () => new game.modules.get(MOD).api.PrunerAboutV1().render(true)
        },
        {
          action: "refresh",
          label: "Refresh",
          icon: "fas fa-rotate",
          callback: async (event, button, dialog) => {
            dialog.close({ force: true });
            await ChatPrunerDialog.show();
          }
        }
      ]
    });

    dlg.on("rendered", () => dlg._activateListeners());
    dlg.render(true);
  }

  _activateListeners() {
    const el = this.element;
    if (!el) return;

    // Row click toggles checkbox (except direct clicks on inputs/buttons/labels)
    el.find(`.${MOD}-row`).on("click", (ev) => {
      if (["INPUT", "BUTTON", "LABEL", "A"].includes(ev.target.tagName)) return;
      const $row = $(ev.currentTarget);
      const $cb = $row.find(`input[type=checkbox].sel`);
      if ($cb.is(":enabled")) $cb.prop("checked", !$cb.prop("checked"));
    });

    // Select All
    el.find(`#${MOD}-select-all`).on("change", (ev) => {
      const checked = ev.currentTarget.checked;
      el.find(`input[type=checkbox].sel:enabled`).prop("checked", checked);
    });
  }

  async _deleteSelected() {
    const el = this.element;
    if (!el) return;
    const ids = el.find(`input[type=checkbox].sel:checked`).map((_, cb) => cb.value).get();

    if (!ids.length) return ui.notifications.warn("No messages selected.");

    const confirmed = await Dialog.confirm({
      title: "Delete Selected Messages",
      content: `<p>Delete ${ids.length} selected message(s)? This cannot be undone.</p>`
    });
    if (!confirmed) return;

    await this._deleteByIds(ids);
  }

  async _deleteAfterAnchor() {
    const el = this.element;
    if (!el) return;

    const anchorId = el.find(`input[type=radio].anchor:checked`).val();
    if (!anchorId) return ui.notifications.warn("Choose an anchor message first.");

    const rows = ChatPrunerDialog._getLastMessages(200); // oldest→newest
    const idx = rows.findIndex(r => r.id === anchorId);
    if (idx === -1) return ui.notifications.error("Anchor message not found.");

    const after = rows.slice(idx + 1);
    const ids = after.filter(r => r.canDelete).map(r => r.id);
    const blocked = after.filter(r => !r.canDelete).length;

    if (!ids.length) return ui.notifications.info("No deletable messages after the selected anchor.");

    const confirmed = await Dialog.confirm({
      title: "Delete Messages After Anchor",
      content: `<p>Delete ${ids.length} message(s) after the anchor? ${blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""}</p>`
    });
    if (!confirmed) return;

    await this._deleteByIds(ids);
  }

  async _deleteByIds(ids) {
    // GM-only UI, but still respect per-message permissions
    const can = ids.filter(id => {
      const m = game.messages.get(id);
      return m && (m.canUserModify(game.user, "delete") || game.user.isGM);
    });

    if (!can.length) return ui.notifications.error("You don't have permission to delete the selected messages.");

    try {
      await game.messages.deleteDocuments(can);
      ui.notifications.info(`Deleted ${can.length} message(s).`);
      this.close({ force: true });
      await ChatPrunerDialog.show(); // refresh list
    } catch (err) {
      console.error(`${MOD} | delete failed`, err);
      ui.notifications.error("Some messages could not be deleted. See console for details.");
    }
  }
}
