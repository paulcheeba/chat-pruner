# chat-pruner
Adds a button under the chat box to open a DialogV2 listing the last 200 chat messages for multi-select deletion, plus 'delete all after selected'.
# Chat Pruner

Chat Pruner is a simple tool for cleaning up your game’s chat log.  
It adds a button to the chat sidebar so you can quickly open a window and manage old messages.

---

## What it does

- Shows the **last 200 messages** in your chat log.  
- Lets you **select multiple messages** and delete them all at once.  
- Lets you pick one message and **delete everything after it** in the log.  
- Respects permissions — GMs can delete all messages, players can only delete their own.

---

## How to use it

1. **Enable the module** in *Manage Modules* once it’s installed.  
2. Go to the **Chat Log** in Foundry.  
3. Under the message input box, you’ll see two new buttons:  
   - **Manage Chat** — opens the Chat Pruner window.
4. In the Chat Pruner window:  
   - Use the checkboxes to select messages and click **Delete Selected**.  
   - Use the radio button next to a message to set it as an “anchor” and click **Delete After Anchor** to remove all newer messages.  
5. Confirm when asked — deleted messages are gone for good.

---

## Tips

- Only the last 200 messages are shown at once.  
- Clicking anywhere on a row will toggle its checkbox.  
- You can use the “Select All” box at the top to quickly select every deletable message.  
- If you don’t see the button, make sure the module is enabled and you have the right permissions.

---

## Who should use it

- **Game Masters** who want to tidy up cluttered chat logs.  
- **Players** who want to clear their own old rolls or test messages (if the GM allows).
