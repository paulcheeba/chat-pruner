// templateAppV2.js
// A minimal-but-mighty ApplicationV2 example with tabs, PARTS, actions, forms, and enrichment.
// Works on Foundry VTT v13+ (ApplicationV2 + HandlebarsApplicationMixin).
// Docs I followed: ApplicationV2 tabs & lifecycle, HandlebarsApplication PARTS, loadTemplates, Tabs UX. See module README for links.

/* global game, ui, foundry */

// If you're packaging this inside a module, set your module ID here:
const MODULE_ID = "fvtt-chat-pruner"; // ← replace with your module id (e.g., "about-time-v13")

// Pull in the Handlebars rendering behavior onto ApplicationV2.
// This is the documented pattern in v13.  (HandlebarsApplicationMixin(ApplicationV2))
const { ApplicationV2 } = foundry.applications.api;
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { loadTemplates } = foundry.applications.handlebars;

export class TemplateAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {

  /** Default config for this app instance */
  static DEFAULT_OPTIONS = {
    id: "template-appv2",
    classes: ["template-appv2"],
    // Standard AppV2 window settings
    window: {
      title: "AppV2 Template Demo",
      icon: "fa-solid fa-cubes",
      resizable: true
    },
    position: {
      width: 680,
      height: "auto" // let content define height
    },
    // Map DOM data-action values to methods on this class.
    // ApplicationV2 wires click events with data-action to _onClickAction internally.
    actions: {
      rollDice: function (event) { return this._actionRollDice(event); },
      notify: function (event) { return this._actionNotify(event); },
      swapTab: function (event) { return this._actionSwapTab(event); },
      submitExample: function (event) { return this._actionSubmitExample(event); }
    }
  };

  /**
   * PARTS: register template “parts” that HandlebarsApplication will render.
   * Here we keep it simple and render one root body.
   * You can add more parts later (e.g., footer) for partial re-renders.
   */
  static PARTS = {
    body: {
      id: "body",
      // Using a module path is the most robust approach in modules.
      template: `modules/${MODULE_ID}/templates/templateAppV2.hbs`
    }
  };

  /**
   * TABS: define our tab groups. AppV2 will manage state and provides changeTab().
   * - group name "primary" matches our data-group attributes in the template.
   * - navSelector selects the clickable tab <a.item> elements.
   * - contentSelector selects the tab panes to show/hide.
   * - initial picks the first tab to open.
   */
  // Bind TabsV2 to the nav container, not the individual .item elements.
  // Use array form with an explicit id so changeTab('...', 'primary') works.
  static TABS = [
    {
      id: "primary",
      navSelector: '.tabs[data-group="primary"]',
      contentSelector: '.tab[data-group="primary"]',
      initial: "overview"
    }
  ];

  /**
   * Optionally expose a default tab selection by overriding tabGroups.
   * If omitted, AppV2 uses TABS.initial; defining this shows how to preseed state.
   */
  tabGroups = { primary: "overview" };

  /**
   * Preload any partials you plan to {{> include}} (optional).
   * We keep this demo simple but show where it belongs.
   */
  async _preFirstRender() {
    await loadTemplates([
      // e.g. `modules/${MODULE_ID}/templates/partials/somePartial.hbs`
    ]);
  }

  /**
   * Prepare data for the template.
   * Note: AppV2 will auto-prepare a single tabs group; but we also add helpful values.
   */
  async _prepareContext() {
    // Example dynamic state we’ll show in the template:
    const now = new Date();
    const tab = this.tabGroups?.primary ?? "overview";

    // Example list for #each demo
    const list = [
      { id: 1, label: "Alpha" },
      { id: 2, label: "Beta" },
      { id: 3, label: "Gamma" }
    ];

    return {
      moduleId: MODULE_ID,
      tab,                               // current primary tab
      version: game?.version ?? "v13",
      user: game?.user?.name ?? "User",
      list,
  enrichedText: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        "This is **bold**, _italic_, a roll: [[/roll 1d20+5]], and a @UUID[Compendium.pf2e.actionspf2e.Jump]{compendium link}.",
        { async: true }
      )
    };
  }

  /* ---------- Actions (data-action="...") ---------- */

  async _actionRollDice(event) {
    event.preventDefault();
    const r = await (new Roll("1d20 + 5")).roll({ async: true });
    r.toMessage({ flavor: "AppV2 demo roll" });
  }

  async _actionNotify(event) {
    event.preventDefault();
    ui.notifications.info("Hello from AppV2 actions ✨");
  }

  async _actionSwapTab(event) {
    event.preventDefault();
    // Demonstrate programmatic tab switching:
    const next = event?.currentTarget?.dataset?.target ?? "overview";
    this.changeTab(next, "primary", { event, force: true, updatePosition: true });
  }

  async _actionSubmitExample(event) {
    event.preventDefault();
    // When using a top-level <form>, ApplicationV2 exposes .form and .submit().
    // Here we just read inputs and show an info message.
    const form = this.form ?? this.element.querySelector("form");
    if (!form) return ui.notifications.warn("No form found.");
    const fd = new FormData(form);
    const name = fd.get("name")?.toString()?.trim() || "(empty)";
    const color = fd.get("color")?.toString() || "#888888";
    ui.notifications.info(`Form submitted — name: ${name}, color: ${color}`);
  }

  /* ---------- Nice-to-have header control example ---------- */

  /** Add a small header menu entry to re-center window (purely demonstrative). */
  _getHeaderControls() {
    const controls = super._getHeaderControls?.() ?? [];
    controls.push({
      icon: "fa-solid fa-arrows-to-circle",
      label: "Center",
      class: "center-window",
      onclick: () => this.setPosition({ left: null, top: null }) // let Foundry center it
    });
    return controls;
  }
}

// Optional convenience: expose the class on global for macro friendliness.
globalThis.TemplateAppV2 = TemplateAppV2;

// Optional tiny API so other modules/macros can open/restore a single instance.
Hooks.once("init", function () {
  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api ??= {};
    mod.api.templateApp ??= {
      instance: null,
      open(options = {}) {
        if (!this.instance || this.instance._state === Application.RENDER_STATES.CLOSED) {
          this.instance = new TemplateAppV2(options);
        }
        this.instance.render(true);
        return this.instance;
      }
    };
  }
});
