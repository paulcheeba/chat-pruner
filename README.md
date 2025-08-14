# Chat Pruner

Chat Pruner is a GM-only tool for tidying up your game’s chat log.

## What it does

- Shows the **last 200 messages** in your chat log  
- Lets you **select multiple** messages and delete them  
- Lets you choose an **anchor** and:
  - **Delete newer than anchor**
  - **Delete older than anchor**
- Respects permissions — GM only

## How to use it

1. Create a **Macro** with this code and run it as GM:
   ```js
   game.modules.get('fvtt-chat-pruner')?.api?.open();
   ```
2- In the window:
- Use checkboxes to select and Delete Selected
- Pick a radio button to set the Anchor, then delete newer or older than it
- Hover over a message preview to see the full text tooltip
- Click Refresh to reload the list

3- Tips
- The Preview shows up to two lines; hover to see the full message
- The footer stays pinned so actions are always visible
- Selected rows are highlighted for clarity
- If you want a toggle between **Nord** and **Dracula** palettes, I can add a world setting and swap the CSS variables accordingly.
