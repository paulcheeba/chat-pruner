// fvtt-chat-pruner — GM-only chat pruning tool (v11–v13) — Application (v1) only
const MOD = "fvtt-chat-pruner";

/** Safely strip HTML to plain text across FVTT versions/browsers */
function stripHTMLSafe(input) {
  const html = String(input ?? "");
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  return text;
}

/** Defensive can-delete check across versions */
function canDeleteMessage(msg, user) {
  try {
    if (user?.isGM) return true;
    if (typeof msg?.canUserModify === "function") return msg.canUserModify(user, "delete");
    if ("isOwner" in msg) return !!msg.isOwner;
  } catch (e) { /* ignore */ }
  return false;
}

/** Cross-version bulk delete */
async function deleteMessagesByIds(ids) {
  // Prefer collection bulk delete if available
  const coll = game.messages;
  if (coll && typeof coll.deleteDocuments === "function") {
    return coll.deleteDocuments(ids);
  }
  // FVTT sometimes exposes static bulk delete on the document class
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

Hooks.once("init", async () => {
  await loadTemplates([`modules/${MOD}/templates/chat-pruner.hbs`]);
});

Hooks.once("ready", () => {
  const mod = game.modules.get(MOD);
  if (mod) {
    mod.api = { open: () => ChatPrunerApp.open() };
  }
  console.log(`${MOD} | Ready. Create a Macro with: game.modules.get('${MOD}')?.api?.open()`);
});

class ChatPrunerApp extends Application {
  static open() {
    if (!game.user?.isGM) {
      ui.notifications?.warn?.("Chat Pruner is GM-only.");
      return;
    }
    const existing = Object.values(ui.windows).find((w) => w instanceof ChatPrunerApp);
    if (existing) return existing.bringToTop();
    new ChatPrunerApp().render(true);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MOD}-window`,
      title: "Chat Pruner",
      template: `modules/${MOD}/templates/chat-pruner.hbs`,
      width: 820,
      height: 660,
      resizable: true,
      classes: [MOD],
    });
  }

  getData() {
    const rows = this._getLastMessages(200);
    return { rows, count: rows.length };
  }

  _getLastMessages(limit) {
    const all = game.messages?.contents ?? [];
    // Ensure oldest → newest (needed for anchor logic)
    const slice = all.slice(-limit).sort((a, b) => (a?.timestamp ?? 0) - (b?.timestamp ?? 0));
    return slice.map((m) => {
      const ts = m?.timestamp ?? m?._source?.timestamp ?? 0;
      const when = ts ? new Date(ts).toLocaleString() : "";
      const speaker = m?.speaker?.alias || m?.speaker?.actor || "—";
      const user = m?.user?.name ?? "Unknown";
      return {
        id: m?.id,
        when,
        ts,
        user,
        speaker,
        content: this._summarize(m),
        canDelete: canDeleteMessage(m, game.user),
      };
    });
  }

  _summarize(msg) {
    const html = msg?.flavor || msg?.content || "";
    cons
