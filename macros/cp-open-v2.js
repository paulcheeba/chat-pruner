/* Chat-Pruner Macro — Open V2
 * Version: v13.1.3.6
 */
if (!globalThis.ChatPrunerV2) {
  ui.notifications?.warn("Chat-Pruner V2 is not available. Is the module enabled?");
} else {
  const app = new ChatPrunerV2();
  app.render(true);
}
