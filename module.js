/**
 * Chat Pruner - Main Module (Application V1)
 * Version: 13.1.5.1.2
 * Compatible: Foundry VTT v11-v13
 * Description: GM-only chat pruning tool with multi-select delete and anchor functionality
 */

// Import shared utilities
import {
  stripHTMLSafe,
  canDeleteMessage,
  deleteMessagesByIds,
  getLastMessages,
  performDeleteOperation,
  CHAT_PRUNER_CONSTANTS,
} from "./chat-pruner-shared.js";

// fvtt-chat-pruner — GM-only chat pruning tool (v11–v13) — Application (v1) only
const MOD = "fvtt-chat-pruner";

// Add a Chat Pruner button under the Journal/Notes toolbar (v13-safe, single handler)
Hooks.on("getSceneControlButtons", (controls) => {
  // v13: controls is a record; Journal Notes is typically "notes"
  const notes = controls?.notes ?? controls?.journal;
  if (!notes) return;

  // Debounced opener to avoid double-firing across cores
  let _lastRun = 0;
  const _openOnce = () => {
    const now = Date.now();
    if (now - _lastRun < CHAT_PRUNER_CONSTANTS.MIN_DEBOUNCE_DELAY) return;
    _lastRun = now;
    game.modules.get("fvtt-chat-pruner")?.api?.open?.();
  };

  // Define the tool once
  const tool = {
    name: "chat-pruner",
    title: "Chat Pruner",
    icon: "fa-regular fa-hand-scissors",
    button: true,
    visible: game.user?.isGM === true,
    // v13.350+ uses onChange; run regardless of 'active' per official example
    onChange: () => {
      _openOnce();
    }, // Older cores may still call onClick; keep as fallback without double-triggering
    onClick: _openOnce,
    // Place at bottom of the tool list to avoid reordering issues
    order: Array.isArray(notes.tools)
      ? notes.tools.length
      : Object.keys(notes.tools ?? {}).length,
  };

  // v13: tools is a record; pre-v13: array. Handle both additively.
  if (Array.isArray(notes.tools)) {
    // Pre-v13 compatibility (array)
    const exists = notes.tools.some((t) => t.name === tool.name);
    if (!exists) notes.tools.push(tool);
  } else {
    // v13 (record/object)
    notes.tools ??= {};
    if (!notes.tools[tool.name]) notes.tools[tool.name] = tool;
  }
});

Hooks.once("init", async () => {
  await loadTemplates([
    `modules/${MOD}/templates/chat-pruner.hbs`,
    `modules/${MOD}/templates/chat-pruner-v2.hbs`, // V2 additive template
  ]);
});

Hooks.once("ready", () => {
  const mod = game.modules.get(MOD);
  if (mod) {
    mod.api = { open: () => ChatPrunerApp.open() };
  }
  console.log(
    `${MOD} | Ready. Create a Macro with: game.modules.get('${MOD}')?.api?.open()`
  );
});

class ChatPrunerApp extends Application {
  static open() {
    if (!game.user?.isGM) {
      ui.notifications?.warn?.("Chat Pruner is GM-only.");
      return;
    }
    const existing = Object.values(ui.windows).find(
      (w) => w instanceof ChatPrunerApp
    );
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
    const rows = getLastMessages(CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT);
    return { rows, count: rows.length };
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
      html
        .find("input.sel[type=checkbox]:enabled")
        .prop("checked", checked)
        .trigger("change");
    });

    // Visual highlight when a row is selected
    html.find("input.sel[type=checkbox]").on("change", (ev) => {
      const $row = $(ev.currentTarget).closest(".pruner-row");
      $row.toggleClass("is-selected", ev.currentTarget.checked);
    });

    // Buttons
    html
      .find("[data-action=deleteSelected]")
      .on("click", () => this._deleteSelected(html));
    html
      .find("[data-action=deleteNewer]")
      .on("click", () => this._deleteNewerThanAnchor(html));
    html
      .find("[data-action=deleteOlder]")
      .on("click", () => this._deleteOlderThanAnchor(html));
    html.find("[data-action=refresh]").on("click", () => this.render(true));
    html.find("[data-action=about]").on("click", () => this._about());
  }

  async _deleteSelected(html) {
    const ids = html
      .find("input.sel[type=checkbox]:checked")
      .map((_, el) => el.value)
      .get();
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
    if (!anchorId)
      return ui.notifications?.warn?.("Choose an anchor message first.");

    const rows = getLastMessages(CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT);
    const idx = rows.findIndex((r) => r.id === anchorId);
    if (idx === -1)
      return ui.notifications?.error?.("Anchor message not found.");

    const newer = rows.slice(idx + 1);
    const ids = newer.filter((r) => r.canDelete).map((r) => r.id);
    const blocked = newer.filter((r) => !r.canDelete).length;

    if (!ids.length)
      return ui.notifications?.info?.(
        "No deletable messages newer than the selected anchor."
      );

    const ok = await Dialog.confirm({
      title: "Delete Newer Than Anchor",
      content: `<p>Delete ${
        ids.length
      } newer message(s) than the selected anchor? ${
        blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""
      }</p>`,
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteOlderThanAnchor(html) {
    const anchorId = html.find("input.anchor[type=radio]:checked").val();
    if (!anchorId)
      return ui.notifications?.warn?.("Choose an anchor message first.");

    const rows = getLastMessages(CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT);
    const idx = rows.findIndex((r) => r.id === anchorId);
    if (idx === -1)
      return ui.notifications?.error?.("Anchor message not found.");

    const older = rows.slice(0, idx);
    const ids = older.filter((r) => r.canDelete).map((r) => r.id);
    const blocked = older.filter((r) => !r.canDelete).length;

    if (!ids.length)
      return ui.notifications?.info?.(
        "No deletable messages older than the selected anchor."
      );

    const ok = await Dialog.confirm({
      title: "Delete Older Than Anchor",
      content: `<p>Delete ${
        ids.length
      } older message(s) than the selected anchor? ${
        blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""
      }</p>`,
    });
    if (!ok) return;

    await this._deleteByIds(ids);
  }

  async _deleteByIds(ids) {
    const deletable = ids.filter((id) => {
      const m = game.messages.get(id);
      return m && canDeleteMessage(m, game.user);
    });

    if (!deletable.length)
      return ui.notifications?.error?.(
        "You don't have permission to delete the selected messages."
      );

    await performDeleteOperation(deletable, {
      onSuccess: () => this.render(true),
      onError: () => {}, // Error already handled by performDeleteOperation
    });
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
