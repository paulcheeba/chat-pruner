/**
 * Chat Pruner - ApplicationV2 Module (Future Compatibility)
 * Version: 13.1.4.5
 * Compatible: Foundry VTT v12+ (ApplicationV2 required)
 * Description: Modern ApplicationV2 implementation with graceful fallback
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
      template: `modules/${MOD}/templates/chat-pruner-v2.hbs`,
    };

    /**
     * Manual render method implementation when HandlebarsApplicationMixin is not available
     * ApplicationV2 requires either HandlebarsApplicationMixin or manual _renderHTML/_replaceHTML
     */
    async _renderHTML(context, options) {
      if (HandlebarsApplicationMixin) {
        // HandlebarsApplicationMixin provides this method
        return super._renderHTML(context, options);
      }

      // Manual fallback implementation
      try {
        const template = this.options.template;
        if (!template) {
          throw new Error("No template specified for ApplicationV2");
        }

        // Load and compile template
        const compiled = await getTemplate(template);
        return compiled(context);
      } catch (error) {
        console.error(`${MOD} | Error in _renderHTML fallback:`, error);
        return `<div class="error">Template rendering failed: ${error.message}</div>`;
      }
    }

    async _replaceHTML(element, html, options) {
      if (HandlebarsApplicationMixin) {
        // HandlebarsApplicationMixin provides this method
        return super._replaceHTML(element, html, options);
      }

      // Manual fallback implementation
      try {
        element.innerHTML = html;
        this.activateListeners(element);
      } catch (error) {
        console.error(`${MOD} | Error in _replaceHTML fallback:`, error);
        element.innerHTML = `<div class="error">HTML replacement failed: ${error.message}</div>`;
      }
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

        // Shape a simple read-only view (no delete; we'll add actions only after approval)
        const rows = last.map((m) => ({
          id: m.id,
          ts: m.timestamp,
          when: new Date(m.timestamp).toLocaleString(),
          user: m.author?.name ?? m.user?.name ?? "—", // Use author (v12+) with fallback to user
          speaker: m.speaker?.alias ?? m.speaker?.actor ?? "—",
          preview: (m.flavor || m.content || "")
            .replace(/<[^>]+>/g, "")
            .slice(0, 140),
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

    /** Optional: local listeners (none yet; keep minimal) */
    activateListeners(html) {
      super.activateListeners(html);
      // Future additive actions go here (e.g., open v1 from v2, dry-run, filters). Keeping empty per your request.
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
