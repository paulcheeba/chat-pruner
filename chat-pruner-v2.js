/**
 * Chat Pruner - V2 Application (chat-pruner-v2.js)
 * Version: 13.2.0.0
 * Compatible: Foundry VTT v12+ (ApplicationV2 required)
 * Description: Modern ApplicationV2 with native form controls - STABLE BASELINE
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

// Chat Pruner — Application V2 (additive, keeps v1 intact)
const MOD = CHAT_PRUNER_CONSTANTS.MODULE_ID;

// Only define V2 class if ApplicationV2 is available
let ChatPrunerAppV2;

// Check for ApplicationV2 in both global and foundry.applications.api namespaces
const ApplicationV2Class =
  globalThis.ApplicationV2 || foundry?.applications?.api?.ApplicationV2;
const HandlebarsApplicationMixin =
  foundry?.applications?.api?.HandlebarsApplicationMixin;

if (ApplicationV2Class) {
  /**
   * Minimal V2 shell: opens a window and lists the last 200 messages (read-only for now).
   * We'll keep behavior lean until you approve further features.
   * Only available if ApplicationV2 exists.
   * Uses HandlebarsApplicationMixin to provide render methods (_renderHTML, _replaceHTML).
   */
  const BaseClass = HandlebarsApplicationMixin
    ? HandlebarsApplicationMixin(ApplicationV2Class)
    : ApplicationV2Class;

  ChatPrunerAppV2 = class extends BaseClass {
    static DEFAULT_OPTIONS = {
      id: "fvtt-chat-pruner-v2",
      window: {
        title: "Chat Pruner (V2)",
        icon: "fa-regular fa-hand-scissors",
      },
      tag: "section",
      classes: ["fvtt-chat-pruner", "fvtt-chat-pruner-v2"],
      position: { width: 720, height: 480, top: null, left: null },
      actions: {},
    };

    /**
     * ApplicationV2 requires PARTS configuration for template rendering
     * This replaces the old V1 template property
     */
    static PARTS = {
      main: {
        template: `modules/${MOD}/templates/chat-pruner-v2.hbs`,
      },
    };

    /**
     * Helper function for permission checking (instance method for use in _prepareContext)
     */
    _canDeleteMessage(msg, user) {
      // Use shared utility function
      return canDeleteMessage(msg, user);
    }

    /** V2 lifecycle — provide data to the template */
    async _prepareContext(_options = {}) {
      console.log(`${MOD} | _prepareContext called with options:`, _options);
      const rows = getLastMessages(CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT);
      return { count: rows.length, rows };
    }

    /**
     * Alternative lifecycle method for Foundry v13 ApplicationV2
     * Some versions use _preparePartContext instead of _prepareContext
     */
    async _preparePartContext(_options = {}) {
      console.log(
        `${MOD} | _preparePartContext called (alternative lifecycle)`
      );
      return this._prepareContext(_options);
    }

    /**
     * ApplicationV2 lifecycle method - called after DOM is rendered
     * CSS now handles all form element styling - no JavaScript manipulation needed
     */
    _onRender(context, options) {
      console.log(`${MOD} | _onRender called - DOM ready`);
    }

    // ========================================
    // V2 Action Handlers (Static Methods)
    // ========================================

    /**
     * Helper function for bulk delete (mirroring V1's deleteMessagesByIds)
     */
    async _deleteMessagesByIds(ids) {
      return deleteMessagesByIds(ids);
    }

    /**
     * Delete Selected Messages Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async _deleteSelected(event, target) {
      event.preventDefault();
      const ids = Array.from(
        this.element.querySelectorAll("input.sel[type=checkbox]:checked")
      ).map((el) => el.value);

      if (!ids.length) {
        return ui.notifications?.warn?.("No messages selected.");
      }

      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Delete Selected Messages" },
        content: `<p>Delete ${ids.length} selected message(s)? This cannot be undone.</p>`,
      });
      if (!ok) return;

      await this._deleteByIds(ids);
    }

    /**
     * Delete Newer Than Anchor Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async _deleteNewerThanAnchor(event, target) {
      event.preventDefault();
      const anchorInput = this.element.querySelector(
        "input.anchor[type=radio]:checked"
      );
      const anchorId = anchorInput?.value;

      if (!anchorId) {
        return ui.notifications?.warn?.("Choose an anchor message first.");
      }

      const rows = getLastMessages(CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT);
      const idx = rows.findIndex((r) => r.id === anchorId);
      if (idx === -1) {
        return ui.notifications?.error?.("Anchor message not found.");
      }

      const newer = rows.slice(idx + 1);
      const ids = newer.map((r) => r.id); // No permission check needed - GM only access
      const blocked = 0; // No blocked messages since only GMs can access

      if (!ids.length) {
        return ui.notifications?.info?.(
          "No deletable messages newer than the selected anchor."
        );
      }

      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Delete Newer Than Anchor" },
        content: `<p>Delete ${
          ids.length
        } newer message(s) than the selected anchor? ${
          blocked
            ? `<em>(${blocked} not deletable due to permissions)</em>`
            : ""
        }</p>`,
      });
      if (!ok) return;

      await this._deleteByIds(ids);
    }

    /**
     * Delete Older Than Anchor Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async _deleteOlderThanAnchor(event, target) {
      event.preventDefault();
      const anchorInput = this.element.querySelector(
        "input.anchor[type=radio]:checked"
      );
      const anchorId = anchorInput?.value;

      if (!anchorId) {
        return ui.notifications?.warn?.("Choose an anchor message first.");
      }

      const rows = getLastMessages(CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT);
      const idx = rows.findIndex((r) => r.id === anchorId);
      if (idx === -1) {
        return ui.notifications?.error?.("Anchor message not found.");
      }

      const older = rows.slice(0, idx);
      const ids = older.map((r) => r.id); // No permission check needed - GM only access
      const blocked = 0; // No blocked messages since only GMs can access

      if (!ids.length) {
        return ui.notifications?.info?.(
          "No deletable messages older than the selected anchor."
        );
      }

      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Delete Older Than Anchor" },
        content: `<p>Delete ${
          ids.length
        } older message(s) than the selected anchor? ${
          blocked
            ? `<em>(${blocked} not deletable due to permissions)</em>`
            : ""
        }</p>`,
      });
      if (!ok) return;

      await this._deleteByIds(ids);
    }

    /**
     * Refresh Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _refresh(event, target) {
      event.preventDefault();
      this.render(true);
    }

    /**
     * About Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _about(event, target) {
      event.preventDefault();
      foundry.applications.api.DialogV2.prompt({
        window: {
          title: "Chat Pruner V2 - Interactive UI Guide",
          width: 600,
          height: 500,
        },
        content: `
          <div style="max-height: 400px; overflow-y: auto; padding-right: 8px;">
            <h2 style="margin-top: 0; border-bottom: 2px solid #4c566a; padding-bottom: 8px;">Selection Controls</h2>
            <p><strong>Select All Checkbox:</strong> Check this to instantly select or deselect all message checkboxes in the list at once.</p>
            <p><strong>Individual Checkboxes:</strong> Check these boxes next to each message to mark them for deletion when using "Delete Selected."</p>

            <h2 style="margin-top: 20px; border-bottom: 2px solid #4c566a; padding-bottom: 8px;">Anchor System</h2>
            <p><strong>Radio Buttons:</strong> Click one radio button to set that message as your reference point for "Delete newer/older than anchor" operations.</p>

            <h2 style="margin-top: 20px; border-bottom: 2px solid #4c566a; padding-bottom: 8px;">Action Buttons</h2>
            <p><strong>Delete Selected:</strong> Removes all messages that have their checkboxes checked (requires confirmation dialog).</p>
            <p><strong>Delete Newer Than Anchor:</strong> Deletes all messages that appear after your selected radio button anchor point.</p>
            <p><strong>Delete Older Than Anchor:</strong> Deletes all messages that appear before your selected radio button anchor point.</p>

            <h2 style="margin-top: 20px; border-bottom: 2px solid #4c566a; padding-bottom: 8px;">Utility Buttons</h2>
            <p><strong>Refresh:</strong> Reloads the message list to show the most current chat state without closing the window.</p>
            <p><strong>About:</strong> Opens this information dialog explaining Chat Pruner features and version details.</p>

            <h2 style="margin-top: 20px; border-bottom: 2px solid #4c566a; padding-bottom: 8px;">Interactive Features</h2>
            <p><strong>Row Clicking:</strong> Click anywhere on a message row (except controls) to toggle that row's selection checkbox.</p>
            <p><strong>Content Tooltips:</strong> Hover over the Preview column to see the full message text in a tooltip popup.</p>

            <p style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #4c566a; font-size: 0.9em; color: #8f98a7;">
              Each component provides immediate visual feedback and follows standard UI conventions for intuitive operation.
            </p>
          </div>
        `,
        ok: { label: "Close" },
      });
    }

    /**
     * Toggle Select All Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _toggleSelectAll(event, target) {
      const checked = target.checked;
      this.element
        .querySelectorAll("input.sel[type=checkbox]:not(:disabled)")
        .forEach((cb) => {
          cb.checked = checked;
          cb.dispatchEvent(new Event("change"));
        });
    }

    /**
     * Helper method to handle delete operations
     * @param {string[]} ids Message IDs to delete
     */
    async _deleteByIds(ids) {
      // Since only GMs can access the app, assume all messages can be deleted
      const deletable = ids.filter((id) => {
        const m = game.messages.get(id);
        return m; // Just check message exists
      });

      if (!deletable.length) {
        return ui.notifications?.error?.(
          "You don't have permission to delete the selected messages."
        );
      }

      await performDeleteOperation(deletable, {
        onSuccess: () => this.render(true),
        onError: () => {}, // Error already handled by performDeleteOperation
      });
    }

    /** Convenience static to open V2 */
    static open() {
      try {
        // Check if ApplicationV2 is available in any namespace
        const ApplicationV2Class =
          globalThis.ApplicationV2 || foundry?.applications?.api?.ApplicationV2;
        if (!ApplicationV2Class) {
          ui?.notifications?.warn?.(
            "Chat Pruner V2 requires Foundry VTT v12+ with ApplicationV2 support."
          );
          console.warn(
            `${MOD} | ApplicationV2 not available. Cannot open V2 interface.`
          );
          return;
        }

        // TODO: Verify game.user API for v13 - defensive null checks
        if (!game?.user?.isGM) {
          const message =
            game?.i18n?.localize?.("Only a GM can open Chat Pruner.") ??
            "GM only.";
          ui?.notifications?.warn?.(message);
          return;
        }

        // TODO: Verify ui.windows API for v13 - defensive window management
        const existing = ui?.windows?.find?.(
          (w) => w?.appId && w.options?.id === this.DEFAULT_OPTIONS.id
        );
        if (existing) return existing.bringToTop();

        const app = new this();
        app.render(true);
        return app;
      } catch (error) {
        console.error(`${MOD} | Error opening ChatPrunerAppV2:`, error);
        ui?.notifications?.error?.(
          `Chat Pruner V2 failed to open: ${error.message}`
        );
      }
    }
  };

  // Configure actions after class definition to avoid circular reference
  ChatPrunerAppV2.DEFAULT_OPTIONS.actions = {
    deleteSelected: ChatPrunerAppV2._deleteSelected,
    deleteNewer: ChatPrunerAppV2._deleteNewerThanAnchor,
    deleteOlder: ChatPrunerAppV2._deleteOlderThanAnchor,
    refresh: ChatPrunerAppV2._refresh,
    about: ChatPrunerAppV2._about,
    toggleSelectAll: ChatPrunerAppV2._toggleSelectAll,
  };
} else {
  // ApplicationV2 not available - create a no-op class
  ChatPrunerAppV2 = class {
    static open() {
      ui?.notifications?.warn?.(
        "Chat Pruner V2 requires Foundry VTT v12+ with ApplicationV2 support."
      );
      console.warn(
        `${MOD} | ApplicationV2 not available. V2 features disabled.`
      );
    }
  };
  console.log(
    `${MOD} | ApplicationV2 not available in any namespace. V2 features disabled.`
  );
}

// Expose as an additive API without touching the v1 init/ready blocks
Hooks.once("ready", () => {
  try {
    // TODO: Verify game.modules API for v13 - defensive module access
    const mod = game?.modules?.get?.(MOD);
    if (!mod) {
      console.warn(`${MOD} | Module not found in game.modules`);
      return;
    }

    // Preserve existing v1 API structure - additive only
    mod.api ??= {};

    // Add new entry point alongside existing v1 `api.open`
    mod.api.openV2 = () => ChatPrunerAppV2.open();

    // Enhanced status reporting
    const foundryVersion = game?.version || "unknown";
    const hasGlobalApplicationV2 = typeof ApplicationV2 !== "undefined";
    const hasFoundryApplicationsApi =
      typeof foundry?.applications?.api?.ApplicationV2 !== "undefined";
    const hasHandlebarsApplicationMixin =
      typeof foundry?.applications?.api?.HandlebarsApplicationMixin !==
      "undefined";
    const hasApplicationV2 =
      hasGlobalApplicationV2 || hasFoundryApplicationsApi;

    const statusMsg = hasApplicationV2
      ? `V2 ready with ApplicationV2 support${
          hasHandlebarsApplicationMixin
            ? " (HandlebarsApplicationMixin)"
            : " (manual render methods)"
        }`
      : "V2 ready (fallback mode - ApplicationV2 not available)";

    console.log(`${MOD} | ${statusMsg}`);
    console.log(`${MOD} | Foundry Version: ${foundryVersion}`);
    console.log(`${MOD} | Global ApplicationV2: ${hasGlobalApplicationV2}`);
    console.log(
      `${MOD} | foundry.applications.api.ApplicationV2: ${hasFoundryApplicationsApi}`
    );
    console.log(
      `${MOD} | foundry.applications.api.HandlebarsApplicationMixin: ${hasHandlebarsApplicationMixin}`
    );
    console.log(
      `${MOD} | ApplicationV2 Available (either): ${hasApplicationV2}`
    );
    console.log(
      `${MOD} | Access via: game.modules.get('${MOD}')?.api?.openV2()`
    );
  } catch (error) {
    console.error(`${MOD} | Error in V2 ready hook:`, error);
  }
});
