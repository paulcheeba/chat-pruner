/**
 * Chat Pruner - Shared Utilities
 * Version: 13.1.5.2.1
 * Compatible: Foundry VTT v11-v13
 * Description: Shared code used by both V1 and V2 applications
 */

const MOD = "fvtt-chat-pruner";

/**
 * Module constants and configuration
 */
export const CHAT_PRUNER_CONSTANTS = {
  MODULE_ID: MOD,
  DEFAULT_MESSAGE_LIMIT: 200,
  MIN_DEBOUNCE_DELAY: 250,
};

/**
 * Safely strip HTML to plain text across FVTT versions/browsers
 * @param {string} input - HTML string to strip
 * @returns {string} Plain text content
 */
export function stripHTMLSafe(input) {
  const html = String(input ?? "");
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent || div.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

/**
 * Defensive can-delete check across versions
 * @param {object} msg - Chat message document
 * @param {object} user - User document
 * @returns {boolean} Whether user can delete the message
 */
export function canDeleteMessage(msg, user) {
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
 * Cross-version bulk delete for chat messages
 * @param {string[]} ids - Array of message IDs to delete
 * @returns {Promise} Deletion promise
 */
export async function deleteMessagesByIds(ids) {
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
 * Get last N messages from chat, sorted oldest to newest
 * @param {number} limit - Maximum number of messages to return
 * @returns {object[]} Array of message data objects
 */
export function getLastMessages(
  limit = CHAT_PRUNER_CONSTANTS.DEFAULT_MESSAGE_LIMIT
) {
  const collection = game.messages;
  if (!collection) return [];

  // Use FVTT v13 Collection.contents instead of values() - safer API
  const all = Array.from(collection.contents ?? collection.values?.() ?? []);

  // Sort oldest → newest for anchor logic
  const sorted = all
    .slice(-limit)
    .sort((a, b) => (a?.timestamp ?? 0) - (b?.timestamp ?? 0));

  return sorted.map((m) => {
    const ts = m?.timestamp ?? m?._source?.timestamp ?? 0;
    const when = ts ? new Date(ts).toLocaleString() : "";
    const speaker = m?.speaker?.alias || m?.speaker?.actor || "—";
    const user = m?.author?.name ?? m?.user?.name ?? "Unknown";

    const fullText = stripHTMLSafe(m?.flavor || m?.content || "");
    const previewText = fullText; // CSS will clamp to 2 lines

    return {
      id: m?.id,
      when,
      ts,
      user,
      speaker,
      content: previewText, // for on-screen preview (V1 compatibility)
      preview: previewText, // for on-screen preview (V2 compatibility)
      full: fullText, // for native browser tooltip
      canDelete: canDeleteMessage(m, game.user),
      message: m, // Include original message for advanced operations
    };
  });
}

/**
 * Perform delete operation with error handling and user feedback
 * @param {string[]} ids - Message IDs to delete
 * @param {object} options - Options for the delete operation
 * @param {function} options.onSuccess - Callback for successful deletion
 * @param {function} options.onError - Callback for error handling
 * @returns {Promise} Delete operation promise
 */
export async function performDeleteOperation(ids, options = {}) {
  const { onSuccess, onError } = options;

  try {
    await deleteMessagesByIds(ids);
    ui.notifications?.info?.(`Deleted ${ids.length} message(s).`);
    if (onSuccess) onSuccess(ids);
  } catch (err) {
    console.error(`${MOD} | delete failed`, err);
    ui.notifications?.error?.(
      "Some messages could not be deleted. See console for details."
    );
    if (onError) onError(err, ids);
  }
}
