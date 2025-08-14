const MOD = "fvtt-chat-pruner";

Hooks.once("init", async () => {
  console.log(`${MOD} | init`);
  // Preload template
  await loadTemplates([`modules/${MOD}/templates/chat-pruner.hbs`]);

  // Simple v1 Application to satisfy the “use both v2 and v1” ask
  class PrunerAboutV1 extends Application {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MOD}-about`,
        title: "Chat Pruner — About",
        template: false,
        width: 420, height: "auto", resizable: true
      });
    }
    async _render(force, options) {
      await super._render(force, options);
      const el = this.element;
      el.html(`
        <section class="window-content">
          <p><strong>Chat Pruner</strong> uses <em>DialogV2</em> for its main UI and this legacy <em>Application (v1)</em> for the About window.</p>
          <p>Compatible with Foundry VTT v11–v13. GM-only deletions recommended.</p>
        </section>
      `);
    }
  }
  game.modules.get(MOD).api = { PrunerAboutV1 };
});

Hooks.once("ready", () => {
  console.log(`${MOD} | ready`);
});

// Insert a button under the chat input
Hooks.on("renderChatLog", (app, html) => {
  // Where to put the button: under the form
  const form = html.find("#chat-form");
  if (!form.length || html.find(`#${MOD}-open`).length) return;

  const $btnRow = $(`<div class="${MOD}-btnrow"></div>`);
  const $open = $(`<button id="${MOD}-open" type="button" class="${MOD}-btn">Manage Chat</button>`);
  const $about = $(`<button id="${MOD}-about" type="button" class="${MOD}-btn ghost">About</button>`);
  $btnRow.append($open, $about);
  form.after($btnRow);

  $open.on("click", () => ChatPrunerDialog.show());
  $about.on("click", () => new game.modules.get(MOD).api.PrunerAboutV1().render(true));
});

// -------- DialogV2 (ApplicationV2) --------
class ChatPrunerDialog extends DialogV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MOD}-dialog`,
      classes: [MOD],
      window: {
        title: "Chat Pruner",
        icon: "fas fa-broom"
      },
      position: { width: 720, height: 600 }
    });
  }

  static _getLastMessages(limit = 200) {
    // game.messages is a Collection of ChatMessage
    const all = game.messages?.contents ?? [];
    // Grab most recent N (already chronological by creation in most cases)
    return all.slice(-limit).map(m => ({
      id: m.id,
      ts: m.timestamp ?? m._source?.timestamp ?? 0,
      user: m.user?.name ?? "Unknown",
      speaker: m.speaker?.alias || m.speaker?.actor || "—",
      content: ChatPrunerDialog._summarize(m),
      canDelete: m.canUserModify(game.user, "delete") || game.user.isGM
    })).sort((a, b) => a.ts - b.ts); // oldest -> newest for stable “after” logic
  }

  static _summarize(message) {
    const html = message.flavor || message.content || "";
    const text = foundry.utils.stripHTML(html ?? "").replace(/\s+/g, " ").trim();
    return text.length > 140 ? text.slice(0, 137) + "…" : text || "(empty)";
  }

  static async show() {
    const data = ChatPrunerDialog._getLastMessages(200);

    const content = await renderTemplate(`modules/${MOD}/templates/chat-pruner.hbs`, {
      rows: data
    });

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

    // Render and wire events once mounted
    dlg.on("rendered", (ev) => dlg._activateListeners());
    dlg.render(true);
  }

  _activateListeners() {
    const el = this.element;
    if (!el) return;

    // Helper: row click toggles checkbox (but not radio)
    el.find(`.${MOD}-row`).on("click", (ev) => {
      if (["INPUT", "BUTTON", "LABEL"].includes(ev.target.tagName)) return;
      const $row = $(ev.currentTarget);
      const $cb = $row.find(`input[type=checkbox].sel`);
      $cb.prop("checked", !$cb.prop("checked"));
    });

    // “Select all” checkbox
    el.find(`#${MOD}-select-all`).on("change", (ev) => {
      const checked = ev.currentTarget.checked;
      el.find(`input[type=checkbox].sel:enabled`).prop("checked", checked);
    });
  }

  async _deleteSelected() {
    const el = this.element;
    if (!el) return;

    const ids = el.find(`input[type=checkbox].sel:checked`).map((_, cb) => cb.value).get();

    if (!ids.length) {
      ui.notifications.warn("No messages selected.");
      return;
    }

    const confirmed = await Dialog.confirm({
      title: "Delete Selected Messages",
      content: `<p>Are you sure you want to delete ${ids.length} selected message(s)? This cannot be undone.</p>`
    });
    if (!confirmed) return;

    await this._deleteByIds(ids);
  }

  async _deleteAfterAnchor() {
    const el = this.element;
    if (!el) return;

    const anchorId = el.find(`input[type=radio].anchor:checked`).val();
    if (!anchorId) {
      ui.notifications.warn("Select an anchor message (radio) first.");
      return;
    }

    // Determine messages AFTER anchor, within the last 200 shown
    const rows = ChatPrunerDialog._getLastMessages(200); // oldest→newest
    const idx = rows.findIndex(r => r.id === anchorId);
    if (idx === -1) {
      ui.notifications.error("Anchor message not found.");
      return;
    }
    const after = rows.slice(idx + 1);
    const ids = after.filter(r => r.canDelete).map(r => r.id);
    const blocked = after.filter(r => !r.canDelete).length;

    if (!ids.length) {
      ui.notifications.info("No deletable messages after the selected anchor.");
      return;
    }

    const confirmed = await Dialog.confirm({
      title: "Delete Messages After Anchor",
      content: `<p>Delete ${ids.length} message(s) after the selected anchor? ${blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""}</p>`
    });
    if (!confirmed) return;

    await this._deleteByIds(ids);
  }

  async _deleteByIds(ids) {
    // Only attempt deletion for messages the user can delete
    const can = ids.filter(id => {
      const m = game.messages.get(id);
      return m && (m.canUserModify(game.user, "delete") || game.user.isGM);
    });

    if (!can.length) {
      ui.notifications.error("You do not have permission to delete the selected messages.");
      return;
    }

    try {
      await game.messages.deleteDocuments(can);
      ui.notifications.info(`Deleted ${can.length} message(s).`);
      // Refresh UI
      this.close({ force: true });
      await ChatPrunerDialog.show();
    } catch (err) {
      console.error(err);
      ui.notifications.error("Some messages could not be deleted. Check console for details.");
    }
  }
}
