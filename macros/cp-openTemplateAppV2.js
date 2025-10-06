// Macro: Open the AppV2 template demo.
// If you set MODULE_ID correctly in the JS file and the module is active,
// this will reuse the single instance if it's already running.

const existingApi = game.modules.get("your-module-id")?.api?.templateApp; // ← replace module id
if (existingApi) {
  existingApi.open();
} else if (globalThis.TemplateAppV2) {
  new globalThis.TemplateAppV2().render(true);
} else {
  ui.notifications.error("TemplateAppV2 not found. Is the module loaded and MODULE_ID set?");
}
