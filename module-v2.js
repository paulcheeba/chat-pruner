// Chat Pruner — Application V2 (additive, keeps v1 intact)
const MOD = "fvtt-chat-pruner";

/**
 * Minimal V2 shell: opens a window and lists the last 200 messages (read-only for now).
 * We’ll keep behavior lean until you approve further features.
 */
class ChatPrunerAppV2 extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "fvtt-chat-pruner-v2",
    window: {
      title: "Chat Pruner (V2)",
      icon: "fa-regular fa-hand-scissors"
    },
    tag: "section",
    classes: ["fvtt-chat-pruner", "fvtt-chat-pruner-v2"],
    position: { width: 640, height: 480, top: null, left: null },
    template: `modules/${MOD}/templates/chat-pruner-v2.hbs`
  };

  /** V2 lifecycle — provide data to the template */
  async _prepareContext(_options = {}) {
    // NOTE: Read-only view for now; mirrors v1’s “last 200 messages” list, formatted minimally.
    const LIMIT = 200;
    const all = Array.from(game.messages?.values?.() ?? []);
    // Sort oldest → newest to match v1’s anchor-friendly order
    all.sort((a, b) => a.timestamp - b.timestamp);
    const last = all.slice(-LIMIT);

    // Shape a simple read-only view (no delete; we’ll add actions only after approval)
    const rows = last.map(m => ({
      id: m.id,
      ts: m.timestamp,
      when: new Date(m.timestamp).toLocaleString(),
      user: m.user?.name ?? "—",
      speaker: m.speaker?.alias ?? m.speaker?.actor ?? "—",
      preview: (m.flavor || m.content || "").replace(/<[^>]+>/g, "").slice(0, 140)
    }));

    return {
      count: rows.length,
      rows
    };
  }

  /** Optional: local listeners (none yet; keep minimal) */
  activateListeners(html) {
    super.activateListeners(html);
    // Future additive actions go here (e.g., open v1 from v2, dry-run, filters). Keeping empty per your request.
  }

  /** Convenience static to open V2 */
  static open() {
    if (!game.user?.isGM) {
      ui.notifications?.warn(game.i18n?.localize?.("Only a GM can open Chat Pruner.") ?? "GM only.");
      return;
    }
    const existing = ui.windows?.find?.(w => w?.appId && w.options?.id === this.DEFAULT_OPTIONS.id);
    if (existing) return existing.bringToTop();
    const app = new this();
    app.render(true);
    return app;
  }
}

// Expose as an additive API without touching the v1 init/ready blocks
Hooks.once("ready", () => {
  const mod = game.modules.get(MOD);
  if (!mod) return;
  mod.api ??= {};
  // Add new entry point alongside existing v1 `api.open`
  mod.api.openV2 = () => ChatPrunerAppV2.open();
});
