# n8n-nodes-discord-dnd

[![npm version](https://badge.fury.io/js/n8n-nodes-discord-dnd.svg)](https://www.npmjs.com/package/n8n-nodes-discord-dnd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is an n8n community node package that provides nodes to interact with the Discord API via a Discord bot, allowing you to automate Discord workflows.

![Discord Nodes Overview](https://raw.githubusercontent.com/nguyendanhda98/n8n-nodes-discord-dnd/main/docs/images/discord-nodes-overview.png)

## Features

This package provides two nodes:
- **Discord Trigger DND**: Triggers workflows based on Discord events
- **Discord Action DND**: Performs actions in Discord channels and conversations

## Discord Trigger Node

The Discord Trigger node allows you to start n8n workflows when specific Discord events occur. It supports a wide range of trigger types:

### Trigger Types
- **Message**: Listen for message-related events like message creation, deletion, updates, and reactions
- **Guild**: Events related to servers, channels, and threads
- **Moderation**: Ban events and audit log entries
- **Emoji & Sticker**: Track emoji and sticker changes in a server
- **Integration & Webhook**: Monitor integration and webhook updates
- **Invite**: Track creation and deletion of invites
- **Voice**: Monitor voice channel activities
- **Presence**: Track user presence status changes
- **Scheduled Event**: Listen for scheduled events in servers
- **Interaction**: Handle interactions like slash commands
- **Bot Status**: Get bot-related events like ready status
- **User**: User updates and guild member events
- **Auto Moderation**: Auto-moderation rule events
- **Poll**: Discord poll events

### Message Filtering
For message triggers, you can filter based on:
- Bot mentions
- Message content (contains, starts with, ends with, equals, regex)
- Direct messages
- Server, channel, role, and user filters

## Discord Action Node

The Discord Action node allows you to perform actions in Discord:

### Message Actions
- Send typing indicator
- Send messages (with text, embeds, and files)
- Delete messages
- Edit messages
- React to messages
- Remove reactions
- Pin/unpin messages

## Installation

### npm
```bash
npm install n8n-nodes-discord-dnd
```

### n8n
In your n8n installation:
1. Go to **Settings > Community Nodes**
2. Click **Install a node**
3. Enter `n8n-nodes-discord-dnd` and click **Install**

## Setup

1. Create a Discord bot on the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new Discord API DND credential in n8n
3. Enter your Bot Token and Application ID
4. Enable necessary Privileged Intents for your bot (Message Content)
5. Invite the bot to your server with appropriate permissions

## Screenshots

### Discord Trigger Node Configuration
![Discord Trigger Node](https://raw.githubusercontent.com/nguyendanhda98/n8n-nodes-discord-dnd/main/docs/images/discord-trigger-node.png)

### Discord Action Node Configuration
![Discord Action Node](https://raw.githubusercontent.com/nguyendanhda98/n8n-nodes-discord-dnd/main/docs/images/discord-action-node.png)

## Usage Examples

### Creating a Discord Bot that Responds to Messages

1. Add a **Discord Trigger DND** node
2. Set trigger type to "Message"
3. Set event to "Message Create"
4. Configure pattern (e.g., "Bot Mention" or "Starts With" with a command prefix)
5. Connect to a **Discord Action DND** node
6. Set action type to "Message" 
7. Set action to "Send Message"
8. Configure the message content

### Logging Channel Changes

1. Add a **Discord Trigger DND** node
2. Set trigger type to "Guild"
3. Set event to "Channel Update" 
4. Connect to nodes that process and store the channel update data

## License

[MIT](LICENSE)

## Contributors

- [NguyenDanhDa](https://github.com/nguyendanhda98)

## Repository

Source code: [https://github.com/nguyendanhda98/n8n-nodes-discord-dnd](https://github.com/nguyendanhda98/n8n-nodes-discord-dnd)

## Troubleshooting

### Common Issues

1. **Bot not responding to messages**
   - Make sure you've enabled the "Message Content Intent" in the Discord Developer Portal
   - Verify the bot has proper permissions in the Discord server
   - Check if the pattern configuration matches your message format

2. **Missing events**
   - Some events require specific intents to be enabled on your bot
   - Make sure the bot has the necessary permissions in the server

3. **Authentication errors**
   - Verify your Bot Token and Application ID are correct
   - Make sure your bot hasn't been reset or regenerated in the Discord Developer Portal

### Support

If you encounter any issues not covered here, please [create an issue](https://github.com/nguyendanhda98/n8n-nodes-discord-dnd/issues) on GitHub.

## Contributing

If you want to contribute, please fork the repository and submit a pull request.

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## Changelog

### 0.1.115
- Initial public release
- Added Discord Trigger node with multiple event types
- Added Discord Action node with message actions
- Setup documentation and repository information
