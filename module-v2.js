// Chat Pruner — Application V2 (additive, keeps v1 intact)
const MOD = "fvtt-chat-pruner";

// Only define V2 class if ApplicationV2 is available
let ChatPrunerAppV2;

if (typeof ApplicationV2 !== "undefined") {
  /**
   * Minimal V2 shell: opens a window and lists the last 200 messages (read-only for now).
   * We'll keep behavior lean until you approve further features.
   * Only available if ApplicationV2 exists.
   */
  ChatPrunerAppV2 = class extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "fvtt-chat-pruner-v2",
    window: {
      title: "Chat Pruner (V2)",
      icon: "fa-regular fa-hand-scissors",
    },
    tag: "section",
    classes: ["fvtt-chat-pruner", "fvtt-chat-pruner-v2"],
    position: { width: 640, height: 480, top: null, left: null },
    template: `modules/${MOD}/templates/chat-pruner-v2.hbs`,
  };

  /** V2 lifecycle — provide data to the template */
  async _prepareContext(_options = {}) {
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

      // Shape a simple read-only view (no delete; we’ll add actions only after approval)
      const rows = last.map((m) => ({
        id: m.id,
        ts: m.timestamp,
        when: new Date(m.timestamp).toLocaleString(),
        user: m.user?.name ?? "—",
        speaker: m.speaker?.alias ?? m.speaker?.actor ?? "—",
        preview: (m.flavor || m.content || "")
          .replace(/<[^>]+>/g, "")
          .slice(0, 140),
      }));

      return {
        count: rows.length,
        rows,
      };
    } catch (error) {
      console.error(`${MOD} | Error in _prepareContext:`, error);
      return { count: 0, rows: [], error: error.message };
    }
  }

  /** Optional: local listeners (none yet; keep minimal) */
  activateListeners(html) {
    super.activateListeners(html);
    // Future additive actions go here (e.g., open v1 from v2, dry-run, filters). Keeping empty per your request.
  }

  /** Convenience static to open V2 */
  static open() {
    try {
      // Check if ApplicationV2 is available
      if (typeof ApplicationV2 === "undefined") {
        ui?.notifications?.warn?.(
          "Chat Pruner V2 requires a newer version of Foundry VTT with ApplicationV2 support."
        );
        console.warn(`${MOD} | ApplicationV2 not available. Cannot open V2 interface.`);
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
      console.warn(`${MOD} | ApplicationV2 not available. V2 features disabled.`);
    }
  };
  console.log(`${MOD} | ApplicationV2 not available. V2 features disabled.`);
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
    const hasApplicationV2 = typeof ApplicationV2 !== "undefined";
    const hasFoundryApplicationsApi = typeof foundry?.applications?.api?.ApplicationV2 !== "undefined";
    
    const statusMsg = hasApplicationV2 
      ? "V2 ready with ApplicationV2 support" 
      : "V2 ready (fallback mode - ApplicationV2 not available)";
    
    console.log(`${MOD} | ${statusMsg}`);
    console.log(`${MOD} | Foundry Version: ${foundryVersion}`);
    console.log(`${MOD} | ApplicationV2 Available: ${hasApplicationV2}`);
    console.log(`${MOD} | foundry.applications.api.ApplicationV2 Available: ${hasFoundryApplicationsApi}`);
    console.log(`${MOD} | Access via: game.modules.get('${MOD}')?.api?.openV2()`);
    
  } catch (error) {
    console.error(`${MOD} | Error in V2 ready hook:`, error);
  }
});
