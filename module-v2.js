/* Chat-Pruner — ApplicationV2 rewrite
 * Version: v13.1.3.8
 * License: MIT
 *
 * Notes:
 * - ApplicationV2 + HandlebarsApplicationMixin scaffold, no refactors outside this file.
 * - Keeps v1 features: preview, anchor filters, selection, GM-gated bulk delete.
 * - Theme: inherits Foundry ThemeV2. CSS uses core variables; no custom theme switch here.
 * - Fade when unfocused: toggles data-inactive on the app root; styles.css handles opacity.
 *
 * References:
 * - AppV2 & HandlebarsApplicationMixin: https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html
 * - HandlebarsApplicationMixin: https://foundryvtt.com/api/functions/foundry.applications.api.HandlebarsApplicationMixin.html
 * - Conversion guide: https://foundryvtt.wiki/en/development/guides/converting-to-appv2
 * - ChatMessage deletion API: https://foundryvtt.com/api/classes/foundry.documents.ChatMessage.html
 */

// Guard multiple registrations.
if (!globalThis.ChatPrunerV2) {
  const { ApplicationV2 } = foundry.applications.api;
  const { HandlebarsApplicationMixin } = foundry.applications.api;

  /** @typedef {import("foundry.js").foundry.documents.ChatMessage} ChatMessage */

  /**
   * ChatPrunerV2 — modern AppV2 UI for pruning chat messages.
   */
  class _ChatPrunerV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
      id: "chat-pruner-v2",
      classes: ["window-app", "cp-app", "chat-pruner", "app-v2"],
      title: "Chat Pruner (V2)",
      position: { width: 720, height: "auto" },
      resizable: true,
      // AppV2 + Handlebars needs a template; without it the window renders empty.
      // NOTE: keep this path in sync with your module id & folder structure.
      template: "modules/fvtt-chat-pruner/templates/chat-pruner-v2.hbs",      
      // Scrollers we preserve between renders
      scrollY: [".cp-list"],
    };

    /** Internal state kept out of the template source-of-truth. */
    #state = {
      anchorMode: "older",     // "older" | "newer"
      anchorId: null,          // ChatMessage id used as anchor
      includeWhispers: false,
      includeRolls: true,
      includeSystem: true,
      selectedIds: new Set(),  // Selected message ids to prune
      limit: 200,              // Safety: initial listing limit
      query: "",               // (future) free-text filter
    };

    /** Return a lid-safe display name. */
    static get appName() { return "ChatPrunerV2"; }

    /** Convenience getter. */
    get isGM() { return game.user?.isGM; }

    /** First render wiring (focus/blur, keybinds, etc.) */
    onFirstRender(html) {
      // Focus/blur fade: use capture to track focus within the window.
      const root = html[0];
      const setInactive = (inactive) => {
        if (inactive) root.setAttribute("data-inactive", "true");
        else root.removeAttribute("data-inactive");
      };
      // Consider the app "active" when any element inside has focus.
      const onFocusIn = () => setInactive(false);
      const onFocusOut = (ev) => {
        // If the newly focused element is outside our app, mark inactive.
        if (!root.contains(ev.relatedTarget)) setInactive(true);
      };

      root.addEventListener("focusin", onFocusIn);
      root.addEventListener("focusout", onFocusOut);

      // Keep references to clean up.
      this._cp_focusHandlers = { onFocusIn, onFocusOut, root };

      // Start inactive if it didn't auto-focus.
      // AppV2 sometimes focuses the header; if not, set to inactive initially.
      queueMicrotask(() => {
        const hasFocusInside = root.contains(document.activeElement);
        setInactive(!hasFocusInside);
      });
    }

    /** Cleanup listeners we created. */
    onClose() {
      if (this._cp_focusHandlers) {
        const { root, onFocusIn, onFocusOut } = this._cp_focusHandlers;
        root.removeEventListener("focusin", onFocusIn);
        root.removeEventListener("focusout", onFocusOut);
      }
      this._cp_focusHandlers = null;
    }

    /** Prepare context for the template on each render. */
    async _prepareContext(_options) {
      const ctx = {};
      // Pull raw messages (limited for UI)
      const coll = game.messages; // WorldCollection<ChatMessage>
      /** @type {ChatMessage[]} */
      const all = coll.contents;

      // Filters based on state.
      const {
        anchorMode, anchorId, includeWhispers, includeRolls, includeSystem, limit, query
      } = this.#state;

      // Build candidate list
      let anchorIndex = -1;
      if (anchorId) {
        anchorIndex = all.findIndex((m) => m.id === anchorId);
      }

      /** Helper predicates */
      const isWhisper = (m) => Array.isArray(m.whisper) && m.whisper.length > 0;
      const isRoll = (m) => !!m.rolls?.length || m.flags?.core?.roll;
      const isSystemMsg = (m) =>
        m.type === CONST.CHAT_MESSAGE_TYPES.OTHER ||
        m.type === CONST.CHAT_MESSAGE_TYPES.OOC && m.user?.isGM && !m.speaker?.actor;

      /** Optional text query (basic) */
      const matchesQuery = (m) => {
        if (!query) return true;
        const text = String(m.content || "").toLowerCase();
        return text.includes(query.toLowerCase());
      };

      // Range select by anchor
      let candidates = all;
      if (anchorId !== null && anchorIndex >= 0) {
        candidates = (anchorMode === "older")
          ? all.slice(0, anchorIndex)          // strictly older than anchor
          : all.slice(anchorIndex + 1);        // strictly newer than anchor
      }

      // Type filters
      candidates = candidates.filter((m) => {
        if (!includeWhispers && isWhisper(m)) return false;
        if (!includeRolls && isRoll(m)) return false;
        if (!includeSystem && isSystemMsg(m)) return false;
        return matchesQuery(m);
      });

      // Safety cap, newest-first by default (Foundry stores in creation order)
      // We'll present reverse chronological.
      candidates = candidates.slice(-limit);

      // Compose context
      ctx.isGM = this.isGM;
      ctx.count = candidates.length;
      ctx.anchorMode = anchorMode;
      ctx.anchorId = anchorId;
      ctx.limit = limit;
      ctx.query = query;
      ctx.includeWhispers = includeWhispers;
      ctx.includeRolls = includeRolls;
      ctx.includeSystem = includeSystem;

      // Project minimal info for the list (keep template lean)
      ctx.messages = candidates
        .map((m) => ({
          id: m.id,
          ts: m.timestamp,
          author: m.alias ?? m.user?.name ?? "—",
          whisper: isWhisper(m),
          roll: !!m.rolls?.length,
          system: isSystemMsg(m),
          content: m.content, // safe: Foundry already sanitizes for display in chat
          selected: this.#state.selectedIds.has(m.id),
        }))
        .reverse(); // newest at top

      // Footer selections
      ctx.selectedCount = this.#state.selectedIds.size;
      ctx.canDelete = this.isGM && ctx.selectedCount > 0;

      return ctx;
    }

    /* ---------------------------------------- */
    /* Event handling                            */
    /* ---------------------------------------- */

    /** Declarative action dispatch (clicks) */
    _onClickAction(event) {
      const button = event.currentTarget;
      const action = button?.dataset?.action;
      if (!action) return;

      switch (action) {
        case "cp.setAnchor":
          this._actionSetAnchor(button.dataset.id);
          break;
        case "cp.toggleMode":
          this._actionToggleMode();
          break;
        case "cp.toggle":
          this._actionToggle(button.dataset.id);
          break;
        case "cp.selectAll":
          this._actionSelectAll(true);
          break;
        case "cp.selectNone":
          this._actionSelectAll(false);
          break;
        case "cp.delete":
          this._actionDeleteSelected();
          break;
        default:
          // no-op
          break;
      }
    }

    /** Declarative change handling (checkboxes, inputs) */
    _onChangeForm(_event, formData) {
      // HandlebarsApplication collects values into formData
      // Expect keys: includeWhispers/includeRolls/includeSystem/limit/query
      const { includeWhispers, includeRolls, includeSystem, limit, query } = formData;
      // Normalize booleans and numbers; AppV2 form handling already gives them reasonably typed.
      this.#state.includeWhispers = !!includeWhispers;
      this.#state.includeRolls = !!includeRolls;
      this.#state.includeSystem = !!includeSystem;
      this.#state.limit = Math.max(10, Number(limit) || 200);
      this.#state.query = String(query ?? "");

      // For now we re-render the whole template. We can switch to parts later.
      this.render();
    }

    /* ---------------------------------------- */
    /* Actions                                   */
    /* ---------------------------------------- */

    _actionSetAnchor(id) {
      this.#state.anchorId = id ?? null;
      this.render();
    }

    _actionToggleMode() {
      this.#state.anchorMode = this.#state.anchorMode === "older" ? "newer" : "older";
      this.render();
    }

    _actionToggle(id) {
      if (!id) return;
      if (this.#state.selectedIds.has(id)) this.#state.selectedIds.delete(id);
      else this.#state.selectedIds.add(id);
      this.render();
    }

    _actionSelectAll(flag) {
      // Select/deselect all currently visible messages in context
      const current = this.element?.querySelectorAll?.(".cp-list [data-id]");
      if (!current?.length) return;
      for (const row of current) {
        const id = row.dataset.id;
        if (flag) this.#state.selectedIds.add(id);
        else this.#state.selectedIds.delete(id);
      }
      this.render();
    }

    async _actionDeleteSelected() {
      if (!this.isGM) {
        ui.notifications?.warn("Chat-Pruner: Only the GM may delete messages.");
        return;
      }
      const ids = [...this.#state.selectedIds];
      if (!ids.length) return;

      // Confirm via DialogV2
      const { DialogV2 } = foundry.applications.api;
      const confirmed = await DialogV2.confirm({
        window: { title: "Delete Selected Chat Messages?" },
        content: `<p>Delete <strong>${ids.length}</strong> message(s)? This cannot be undone.</p>`,
        rejectClose: false
      });
      if (!confirmed) return;

      try {
        // Bulk delete via ChatMessage static API
        await foundry.documents.ChatMessage.deleteDocuments(ids);
        // Clear selection and refresh.
        this.#state.selectedIds.clear();
        this.render();
      } catch (err) {
        console.error("Chat-Pruner V2 deletion failed:", err);
        ui.notifications?.error("Chat-Pruner: Failed to delete selected messages. See console.");
      }
    }

    /* ---------------------------------------- */
    /* Wiring                                    */
    /* ---------------------------------------- */

    /** Map data-action click targets inside the app */
    activateListeners(html) {
      super.activateListeners(html);
      html.on("click", "[data-action]", this._onClickAction.bind(this));

      // Wire filter form changes to _onChangeForm.
      // We’re not using FormApplicationV2, so gather values manually.
      const form = html[0]?.querySelector?.(".cp-filters");
      if (form) {
        const onChange = (ev) => {
          // Build a minimal formData object with the fields we care about.
          const data = {
            includeWhispers: !!form.querySelector('input[name="includeWhispers"]')?.checked,
            includeRolls:    !!form.querySelector('input[name="includeRolls"]')?.checked,
            includeSystem:   !!form.querySelector('input[name="includeSystem"]')?.checked,
            limit:           Number(form.querySelector('input[name="limit"]')?.value ?? 200),
            query:           String(form.querySelector('input[name="query"]')?.value ?? ""),
          };
          this._onChangeForm(ev, data);
        };
        form.addEventListener("change", onChange);
        form.addEventListener("input", onChange);
        // Store for cleanup if needed later.
        this._cp_formHandler = { form, onChange };
      }
    }
  }

  // Expose globally for macro usage.
  globalThis.ChatPrunerV2 = _ChatPrunerV2;
}

/**
 * ------------------------------------------------------------
 * Handlebars helpers for Chat-Pruner V2
 * ------------------------------------------------------------
 * These helpers are registered once on module load. They are
 * safe to call multiple times; registration overwrites quietly.
 */

// Human-readable timestamp (local)
if (typeof Handlebars !== "undefined") {
  Handlebars.registerHelper("timestamp", function(ts) {
    try {
      const date = new Date(ts);
      return date.toLocaleString();
    } catch {
      return ts;
    }
  });

  // Negation helper: {{#if (not var)}}{{/if}}
  Handlebars.registerHelper("not", (v) => !v);
}

/**
 * Utility: Open the Chat Pruner V2 window (for macros/toolbar).
 */
export function openChatPrunerV2() {
  const App = globalThis.ChatPrunerV2;
  const app = new App();
  return app.render(true);
}
