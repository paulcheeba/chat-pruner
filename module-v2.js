/**
 * Chat Pruner - ApplicationV2 Module (Future Compatibility)
 * Version: 13.1.4.8
 * Compatible: Foundry VTT v12+ (ApplicationV2 required)
 * Description: Modern ApplicationV2 implementation with full V1 functionality
 */

// Chat Pruner — Application V2 (additive, keeps v1 intact)
const MOD = "fvtt-chat-pruner";

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
      position: { width: 640, height: 480, top: null, left: null },
      actions: {
        deleteSelected: ChatPrunerAppV2._deleteSelected,
        deleteNewer: ChatPrunerAppV2._deleteNewerThanAnchor,
        deleteOlder: ChatPrunerAppV2._deleteOlderThanAnchor,
        refresh: ChatPrunerAppV2._refresh,
        about: ChatPrunerAppV2._about,
        toggleSelectAll: ChatPrunerAppV2._toggleSelectAll,
        toggleRowSelection: ChatPrunerAppV2._toggleRowSelection,
      },
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
      try {
        if (user?.isGM) return true;
        if (typeof msg?.canUserModify === "function")
          return msg.canUserModify(user, "delete");
        if ("isOwner" in msg) return !!msg.isOwner;
      } catch (e) {
        /* ignore */
      }
      return false;
    }

    /** V2 lifecycle — provide data to the template */
    async _prepareContext(_options = {}) {
      console.log(`${MOD} | _prepareContext called with options:`, _options);
      // TODO: Verify ApplicationV2 lifecycle method name for FVTT v13
      // Common methods: _prepareContext, _preparePartContext, _prepareApplicationContext
      try {
        // NOTE: Read-only view for now; mirrors v1's "last 200 messages" list, formatted minimally.
        const LIMIT = 200;

        // TODO: Verify game.messages Collection API for v13 - using defensive access
        const collection = game.messages;
        if (!collection) {
          console.warn(`${MOD} | No game.messages collection available`);
          return { count: 0, rows: [] };
        }

        // Use FVTT v13 Collection.contents instead of values() - safer API
        const all = Array.from(
          collection.contents ?? collection.values?.() ?? []
        );
        // Sort oldest → newest to match v1’s anchor-friendly order
        all.sort((a, b) => a.timestamp - b.timestamp);
        const last = all.slice(-LIMIT);

        // Shape a data structure matching V1's template requirements with proper permissions
        const rows = last.map((m) => ({
          id: m.id,
          ts: m.timestamp,
          when: new Date(m.timestamp).toLocaleString(),
          user: m.author?.name ?? m.user?.name ?? "—", // Use author (v12+) with fallback to user
          speaker: m.speaker?.alias ?? m.speaker?.actor ?? "—",
          preview: (m.flavor || m.content || "")
            .replace(/<[^>]+>/g, "")
            .slice(0, 140),
          full: (m.flavor || m.content || "").replace(/<[^>]+>/g, ""), // Full text for tooltip
          canDelete: this._canDeleteMessage(m, game.user), // Real permission check for V2 functionality
        }));

        const result = {
          count: rows.length,
          rows,
        };

        // Debug logging to help troubleshoot empty content
        console.log(`${MOD} | _prepareContext result:`, {
          messageCount: all.length,
          limitedCount: last.length,
          resultCount: result.count,
          sampleRow: result.rows[0],
        });

        return result;
      } catch (error) {
        console.error(`${MOD} | Error in _prepareContext:`, error);
        return { count: 0, rows: [], error: error.message };
      }
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

    // ========================================
    // V2 Action Handlers (Static Methods)
    // ========================================

    /**
     * Helper function to get current messages data (mirroring V1's _getLastMessages)
     */
    _getLastMessages(limit = 200) {
      const collection = game.messages;
      if (!collection) return [];

      const all = Array.from(
        collection.contents ?? collection.values?.() ?? []
      );
      all.sort((a, b) => a.timestamp - b.timestamp);
      const last = all.slice(-limit);

      return last.map((m) => ({
        id: m.id,
        canDelete: this._canDeleteMessage(m, game.user),
        timestamp: m.timestamp,
        message: m
      }));
    }

    /**
     * Helper function for permission checking (mirroring V1's canDeleteMessage)
     */
    _canDeleteMessage(msg, user) {
      try {
        if (user?.isGM) return true;
        if (typeof msg?.canUserModify === "function")
          return msg.canUserModify(user, "delete");
        if ("isOwner" in msg) return !!msg.isOwner;
      } catch (e) {
        /* ignore */
      }
      return false;
    }

    /**
     * Helper function for bulk delete (mirroring V1's deleteMessagesByIds)
     */
    async _deleteMessagesByIds(ids) {
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

    /**
     * Delete Selected Messages Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async _deleteSelected(event, target) {
      event.preventDefault();
      const ids = Array.from(this.element.querySelectorAll("input.sel[type=checkbox]:checked"))
        .map(el => el.value);

      if (!ids.length) {
        return ui.notifications?.warn?.("No messages selected.");
      }

      const ok = await Dialog.confirm({
        title: "Delete Selected Messages",
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
      const anchorInput = this.element.querySelector("input.anchor[type=radio]:checked");
      const anchorId = anchorInput?.value;
      
      if (!anchorId) {
        return ui.notifications?.warn?.("Choose an anchor message first.");
      }

      const rows = this._getLastMessages(200);
      const idx = rows.findIndex((r) => r.id === anchorId);
      if (idx === -1) {
        return ui.notifications?.error?.("Anchor message not found.");
      }

      const newer = rows.slice(idx + 1);
      const ids = newer.filter((r) => r.canDelete).map((r) => r.id);
      const blocked = newer.filter((r) => !r.canDelete).length;

      if (!ids.length) {
        return ui.notifications?.info?.(
          "No deletable messages newer than the selected anchor."
        );
      }

      const ok = await Dialog.confirm({
        title: "Delete Newer Than Anchor",
        content: `<p>Delete ${ids.length} newer message(s) than the selected anchor? ${
          blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""
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
      const anchorInput = this.element.querySelector("input.anchor[type=radio]:checked");
      const anchorId = anchorInput?.value;
      
      if (!anchorId) {
        return ui.notifications?.warn?.("Choose an anchor message first.");
      }

      const rows = this._getLastMessages(200);
      const idx = rows.findIndex((r) => r.id === anchorId);
      if (idx === -1) {
        return ui.notifications?.error?.("Anchor message not found.");
      }

      const older = rows.slice(0, idx);
      const ids = older.filter((r) => r.canDelete).map((r) => r.id);
      const blocked = older.filter((r) => !r.canDelete).length;

      if (!ids.length) {
        return ui.notifications?.info?.(
          "No deletable messages older than the selected anchor."
        );
      }

      const ok = await Dialog.confirm({
        title: "Delete Older Than Anchor",
        content: `<p>Delete ${ids.length} older message(s) than the selected anchor? ${
          blocked ? `<em>(${blocked} not deletable due to permissions)</em>` : ""
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
      new Dialog({
        title: "About Chat Pruner",
        content: `<p><strong>Chat Pruner V2</strong> (GM-only). View last 200 chat messages; delete selected; or delete newer/older than an anchor.</p>
                  <p>Compatible with Foundry VTT v12–v13. UI uses ApplicationV2 with HandlebarsApplicationMixin.</p>
                  <p>For V1 interface: <code>game.modules.get('${MOD}')?.api?.open()</code></p>`,
        buttons: { ok: { label: "OK" } },
      }).render(true);
    }

    /**
     * Toggle Select All Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _toggleSelectAll(event, target) {
      const checked = target.checked;
      this.element.querySelectorAll("input.sel[type=checkbox]:not(:disabled)")
        .forEach(cb => {
          cb.checked = checked;
          cb.dispatchEvent(new Event('change'));
        });
    }

    /**
     * Toggle Row Selection Action
     * @this {ChatPrunerAppV2}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _toggleRowSelection(event, target) {
      // Find the checkbox in this row and toggle it
      const row = target.closest('.pruner-row');
      const checkbox = row?.querySelector('input.sel[type=checkbox]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    }

    /**
     * Helper method to handle delete operations
     * @param {string[]} ids Message IDs to delete
     */
    async _deleteByIds(ids) {
      const deletable = ids.filter((id) => {
        const m = game.messages.get(id);
        return m && this._canDeleteMessage(m, game.user);
      });

      if (!deletable.length) {
        return ui.notifications?.error?.(
          "You don't have permission to delete the selected messages."
        );
      }

      try {
        await this._deleteMessagesByIds(deletable);
        ui.notifications?.info?.(`Deleted ${deletable.length} message(s).`);
        this.render(true);
      } catch (err) {
        console.error(`${MOD} | delete failed`, err);
        ui.notifications?.error?.(
          "Some messages could not be deleted. See console for details."
        );
      }
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
