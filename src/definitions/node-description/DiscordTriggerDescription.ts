import { INodeTypeDescription } from "n8n-workflow";
import { PatternType, TriggerType } from "../../Interfaces/types";

export const DiscordTriggerDescription: INodeTypeDescription = {
  displayName: "Discord Trigger",
  name: "discordTrigger",
  icon: "file:../assets/icon/discord.svg",
  group: ["trigger"],
  version: 1,
  description: "Starts the workflow when Discord events occur",
  defaults: {
    name: "Discord Trigger",
  },
  inputs: [],
  outputs: ["main"],
  credentials: [
    {
      name: "discordApi",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Trigger Type",
      name: "triggerType",
      type: "options",
      required: true,
      default: "message",
      description: "The type of Discord event to trigger on",
      options: [
        { name: "Message", value: TriggerType.MESSAGE },
        { name: "Guild", value: TriggerType.GUILD },
        { name: "Moderation", value: TriggerType.MODERATION },
        { name: "Emoji & Sticker", value: TriggerType.EMOJI_STICKER },
        {
          name: "Integration & Webhook",
          value: TriggerType.INTEGRATION_WEBHOOK,
        },
        { name: "Invite", value: TriggerType.INVITE },
        { name: "Voice", value: TriggerType.VOICE },
        { name: "Presence", value: TriggerType.PRESENCE },
        { name: "Scheduled Event", value: TriggerType.SCHEDULED_EVENT },
        { name: "Interaction", value: TriggerType.INTERACTION },
        { name: "Bot Status", value: TriggerType.BOT_STATUS },
        { name: "User", value: TriggerType.USER },
        { name: "Auto Moderation", value: TriggerType.AUTO_MODERATION },
        { name: "Poll", value: TriggerType.POLL },
      ],
    },
    {
      displayName: "Event",
      name: "event",
      type: "options",
      required: true,
      default: "",
      description: "The specific Discord event to listen for",
      typeOptions: {
        loadOptionsMethod: "getEvents",
        loadOptionsDependsOn: ["triggerType"],
      },
    },
    {
      displayName: "Pattern",
      name: "pattern",
      type: "options",
      default: "botMention",
      description: "A filter to apply to the event data",
      displayOptions: {
        show: {
          triggerType: ["message"],
        },
      },
      options: [
        {
          name: "Bot Mention",
          value: PatternType.BOT_MENTION,
          description: "The bot is mentioned or replied in the message",
        },
        {
          name: "Contains",
          value: PatternType.CONTAINS,
          description: "Contains a specific string",
        },
        {
          name: "Starts With",
          value: PatternType.STARTS_WITH,
          description: "Starts with a specific string",
        },
        {
          name: "Ends With",
          value: PatternType.ENDS_WITH,
          description: "Ends with a specific string",
        },
        {
          name: "Equals",
          value: PatternType.EQUALS,
          description: "Equals to a specific string",
        },
        {
          name: "Regex",
          value: PatternType.REGEX,
          description: "Matches a specific regex pattern",
        },
        {
          name: "Every",
          value: PatternType.EVERY,
          description: "The message is in every channel",
        },
      ],
    },
    {
      displayName: "Value",
      name: "value",
      type: "string",
      default: "",
      description: "The value to filter the event data by",
      displayOptions: {
        show: {
          triggerType: ["message"],
          pattern: ["contains", "startsWith", "endsWith", "equals", "regex"],
        },
      },
    },
    {
      displayName: "Direct Message",
      name: "directMessage",
      type: "boolean",
      default: false,
      description: "Whether to trigger on direct messages",
      displayOptions: {
        show: {
          triggerType: ["message"],
        },
      },
    },
    {
      displayName: "Include Bot",
      name: "includeBot",
      type: "boolean",
      default: false,
      description: "Whether to include bot messages in the trigger",
      displayOptions: {
        show: {
          triggerType: ["message"],
        },
      },
    },
    {
      displayName: "Additional Fields",
      name: "additionalFields",
      type: "collection",
      placeholder: "Add Field",
      default: {},
      options: [
        {
          displayName: "Server IDs",
          name: "serverIds",
          type: "string",
          default: "",
          placeholder: "123456789012345678,123456789012345678",
          description:
            "Comma-separated list of server IDs to filter the event data by",
        },
        {
          displayName: "Channel IDs",
          name: "channelIds",
          type: "string",
          default: "",
          placeholder: "123456789012345678,123456789012345678",
          description:
            "Comma-separated list of channel IDs to filter the event data by",
        },
        {
          displayName: "Role IDs",
          name: "roleIds",
          type: "string",
          default: "",
          placeholder: "123456789012345678,123456789012345678",
          description:
            "Comma-separated list of role IDs to filter the event data by",
        },
        {
          displayName: "User IDs",
          name: "userIds",
          type: "string",
          default: "",
          placeholder: "123456789012345678,123456789012345678",
          description:
            "Comma-separated list of user IDs to filter the event data by",
        },
      ],
    },
  ],
};
