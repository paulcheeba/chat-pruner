[![Foundry VTT Version](https://img.shields.io/badge/Foundry%20VTT-v13+-blue)](https://foundryvtt.com/)
[![Latest Release](https://img.shields.io/github/v/release/paulcheeba/chat-pruner)](https://github.com/paulcheeba/chat-pruner/releases/latest)
[![Downloads (All Time)](https://img.shields.io/github/downloads/paulcheeba/chat-pruner/total)](https://github.com/paulcheeba/chat-pruner/releases)
[![Downloads (Latest)](https://img.shields.io/github/downloads/paulcheeba/chat-pruner/latest/total)](https://github.com/paulcheeba/chat-pruner/releases/latest)

# Chat Pruner

**A powerful GM tool for managing and cleaning up your Foundry VTT chat log**

Chat Pruner helps Game Masters maintain organized chat logs by providing flexible options to delete messages selectively or in bulk. Keep your sessions focused and your chat history manageable.

## Key Features

### **Selective Message Management**

- **Individual Selection**: Use checkboxes to select specific messages for deletion
- **Bulk Operations**: Delete multiple messages at once with confirmation
- **Anchor-Based Deletion**: Set a message as an anchor point and delete all newer or older messages
- **Permission Aware**: Respects Foundry's message permissions - only deletable messages are selectable

### **User-Friendly Interface**

- **Recent Messages View**: Displays the last 200 messages for easy browsing
- **Message Previews**: See sender, timestamp, and message content at a glance
- **Hover Tooltips**: View full message text on hover for long messages
- **Visual Feedback**: Selected messages are clearly highlighted

### **GM-Only Security**

- **Permission Control**: Only Game Masters can access and use Chat Pruner
- **Safe Operations**: All deletions require confirmation to prevent accidents
- **Real-time Updates**: Refresh functionality to sync with current chat state

## Screenshots

### Main Interface

<img width="720" height="479" alt="image" src="https://github.com/user-attachments/assets/41a34492-1763-47bf-ac6a-e3608d20554f" />

### Message Selection

<img width="720" height="479" alt="image" src="https://github.com/user-attachments/assets/63a319cc-40a9-4cef-96d3-8bf3ef9878be" />

### Anchor Operations

<img width="719" height="481" alt="image" src="https://github.com/user-attachments/assets/bf034373-b32e-48e2-8b9d-9ac986f59668" />

## Installation

### **Automatic Installation (Recommended)**

Install directly from Foundry VTT's module browser:

1. Open Foundry VTT and go to the **Setup** screen
2. Click **Add-on Modules** tab
3. Click **Install Module**
4. Search for **"Chat Pruner"**
5. Click **Install** on the Chat Pruner result

### **Manual Installation**

Use the latest release manifest URL:

```
https://github.com/paulcheeba/chat-pruner/releases/latest/download/module.json
```

1. In Foundry VTT, go to **Setup** → **Add-on Modules** → **Install Module**
2. Paste the manifest URL above in the **Manifest URL** field
3. Click **Install**

### **Enable the Module**

1. In your World, go to **Settings** → **Manage Modules**
2. Find **Chat Pruner** and check the box to enable it
3. Click **Save Module Settings**

## How to Use

### **Opening Chat Pruner**

1. **Toolbar Access**: Click the Chat Pruner icon in the toolbar (finger scissors icon)
   - Located in: **Toolbars** → **Journal/Notes** → **Chat Pruner**
2. **Alternative**: Use the hotkey if configured in Foundry's controls settings

### **Basic Operations**

#### **Delete Selected Messages**

1. Open Chat Pruner to view recent messages
2. **Check the boxes** next to messages you want to delete
3. Click **"Delete Selected"**
4. **Confirm** the deletion in the popup dialog

#### **Delete by Anchor Point**

1. **Select an anchor**: Click the radio button next to a message to set it as your reference point
2. Choose your operation:
   - **"Delete Newer Than Anchor"**: Removes all messages sent after the selected message
   - **"Delete Older Than Anchor"**: Removes all messages sent before the selected message
3. **Confirm** the bulk deletion

#### **Refresh and Updates**

- Click **"Refresh"** to reload the message list with current chat state
- The list automatically shows the most recent 200 messages
- New messages appear after refreshing

### **Tips for Effective Use**

- **Preview Messages**: Hover over message text to see the complete content
- **Session Cleanup**: Use "Delete Older Than Anchor" at session start to clear previous session
- **Selective Cleanup**: Use individual selection for removing specific spam or errors
- **Bulk Management**: Anchor operations are perfect for clearing large ranges of messages

## Permissions & Security

- **GM Only**: Chat Pruner is exclusively available to Game Master users
- **Permission Respect**: Only messages you have permission to delete will be selectable
- **Confirmation Required**: All deletion operations require explicit confirmation
- **No Auto-Delete**: No messages are deleted without direct user action

## Compatibility

- **Foundry VTT**: Version 13.0.0 and newer
- **Game Systems**: Compatible with all game systems
- **Other Modules**: No known conflicts

## Dependencies

- This module is part of the **OverEngineeredVTT Suite** and Requires the installation of the lightweight OEV Suite Monitor, a master module that tracks OEV module versions for you and lets you know when updates or new modules are available.

## Additional links

- Join our [Discord](https://discord.gg/VNZwZTCB5U) server
- Support me on [Patreon](https://www.patreon.com/cw/u45257624)

## Support & Issues

- **Bug Reports**: [GitHub Issues](https://github.com/paulcheeba/chat-pruner/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/paulcheeba/chat-pruner/discussions)
- **Latest Release**: [Download Here](https://github.com/paulcheeba/chat-pruner/releases/latest)

## License

This module is licensed under the [MIT License](LICENSE).
