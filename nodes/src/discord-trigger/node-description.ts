import { INodeTypeDescription } from 'n8n-workflow';

export const nodeDescription: INodeTypeDescription = {
  displayName: 'Discord Trigger',
  name: 'discordTrigger',
  icon: 'file:discord.svg',
  group: ['trigger'],
  version: 1,
  description: 'Starts the workflow when Discord events occur',
  defaults: {
    name: 'Discord Trigger',
  },
  inputs: [],
  outputs: ['main'],
  credentials: [
    {
      name: 'discordApi',
      required: true,
    },
  ],
  properties: [
    {
      displayName: 'Trigger Type',
      name: 'triggerType',
      type: 'options',
      options: [
        {
          name: 'Message Content',
          value: 'messageContent',
          description: 'Triggered based on message content patterns',
        },
        {
          name: 'Bot Interaction',
          value: 'botInteraction',
          description: 'Triggered when users interact with the bot',
        },
      ],
      default: 'messageContent',
      required: true,
    },
    // Bot Interaction Options
    {
      displayName: 'Interaction Type',
      name: 'interactionType',
      type: 'options',
      displayOptions: {
        show: {
          triggerType: ['botInteraction'],
        },
      },
      options: [
        {
          name: 'Bot Mentioned',
          value: 'botMentioned',
          description: 'Triggered when someone mentions the bot in a message',
        },
        {
          name: 'Message Replied To',
          value: 'messageReplied',
          description: 'Triggered when someone replies to a message from the bot',
        },
      ],
      default: 'botMentioned',
      required: true,
    },
    // Message Content Options
    {
      displayName: 'Match Pattern',
      name: 'matchPattern',
      type: 'options',
      displayOptions: {
        show: {
          triggerType: ['messageContent'],
        },
      },
      options: [
        {
          name: 'Bot Mention',
          value: 'botMention',
          description: 'The bot has to be mentioned somewhere in the message',
        },
        {
          name: 'Contains',
          value: 'contains',
          description: 'Match the value in any position in the message',
        },
        {
          name: 'Contains Image',
          value: 'containsImage',
          description: 'Triggers when a message contains an image attachment',
        },
        {
          name: 'Ends With',
          value: 'endsWith',
          description: 'Match the message ending with the specified value',
        },
        {
          name: 'Equals',
          value: 'equals',
          description: 'Match the exact same value',
        },
        {
          name: 'Every',
          value: 'every',
          description: 'Triggers on every discord message',
        },
        {
          name: 'Regex',
          value: 'regex',
          description: 'Match the custom ECMAScript regex provided',
        },
        {
          name: 'Starts With',
          value: 'startsWith',
          description: 'Match the message beginning with the specified value',
        },
      ],
      default: 'botMention',
      required: true,
    },
    {
      displayName: 'Value to Match',
      name: 'matchValue',
      type: 'string',
      default: '',
      description: 'The text value to match in the message',
      required: true,
      displayOptions: {
        show: {
          triggerType: ['messageContent'],
          matchPattern: ['contains', 'endsWith', 'equals', 'startsWith'],
        },
      },
    },
    {
      displayName: 'Regex Pattern',
      name: 'regexPattern',
      type: 'string',
      default: '',
      placeholder: '^\\w+$',
      description: 'The regular expression to match against the message content',
      required: true,
      displayOptions: {
        show: {
          triggerType: ['messageContent'],
          matchPattern: ['regex'],
        },
      },
    },
    {
      displayName: 'Case Sensitive',
      name: 'caseSensitive',
      type: 'boolean',
      default: false,
      description: 'Whether the matching should be case sensitive',
      displayOptions: {
        show: {
          triggerType: ['messageContent'],
          matchPattern: ['contains', 'endsWith', 'equals', 'startsWith'],
        },
      },
    },
    // Common Options
    {
      displayName: 'Include Bot Messages',
      name: 'includeBotMessages',
      type: 'boolean',
      default: false,
      description: 'Whether to include messages from other bots or only from users',
    },
    {
      displayName: 'Filter by Servers',
      name: 'filterByServers',
      type: 'boolean',
      default: false,
      description: 'Whether to filter messages by specific servers',
    },
    {
      displayName: 'Server Names or IDs',
      name: 'serverIds',
      type: 'string',
      default: '',
      description: 'Comma-separated list of server names or IDs to listen to (empty for all servers)',
      displayOptions: {
        show: {
          filterByServers: [true],
        },
      },
      placeholder: 'server1Name, 1234567890123456',
    },
    {
      displayName: 'Filter by Channels',
      name: 'filterByChannels',
      type: 'boolean',
      default: false,
      description: 'Whether to filter messages by specific channels',
    },
    {
      displayName: 'Listen to Channels',
      name: 'channelIds',
      type: 'string',
      default: '',
      description: 'Comma-separated list of channel names or IDs to listen to (empty for all channels)',
      displayOptions: {
        show: {
          filterByChannels: [true],
        },
      },
      placeholder: 'general, 1234567890123456',
    },
    {
      displayName: 'Filter by Roles',
      name: 'filterByRoles',
      type: 'boolean',
      default: false,
      description: 'Whether to filter messages by user roles',
    },
    {
      displayName: 'Listen to Roles',
      name: 'roleIds',
      type: 'string',
      default: '',
      description: 'Comma-separated list of role names or IDs to listen to (empty for all roles)',
      displayOptions: {
        show: {
          filterByRoles: [true],
        },
      },
      placeholder: 'admin, 1234567890123456',
    },
  ],
};