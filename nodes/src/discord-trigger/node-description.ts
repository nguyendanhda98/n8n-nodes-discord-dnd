import { INodeTypeDescription } from "n8n-workflow";

export const nodeDescription: INodeTypeDescription = {
  displayName: "Discord Trigger",
  name: "discordTrigger",
  icon: "file:discord.svg",
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
      displayName: "Resource",
      name: "resource",
      type: "options",
      required: true,
      default: "guild",
      description: "The type of Discord event to trigger on",
      options: [
        { name: "Guild", value: "guild" },
        { name: "Message", value: "message" },
        { name: "Moderation", value: "moderation" },
        { name: "Emoji & Sticker", value: "emojiSticker" },
        { name: "Integration & Webhook", value: "integrationWebhook" },
        { name: "Invite", value: "invite" },
        { name: "Voice", value: "voice" },
        { name: "Presence", value: "presence" },
        { name: "Scheduled Event", value: "scheduledEvent" },
        { name: "Interaction", value: "interaction" },
        { name: "Bot Status", value: "botStatus" },
        { name: "User", value: "user" },
        { name: "Auto Moderation", value: "autoModeration" },
        { name: "Poll", value: "poll" },
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
        loadOptionsDependsOn: ["resource"],
      },
    },
    {
      displayName: "Filter by Servers",
      name: "filterByServers",
      type: "boolean",
      default: false,
      description: "Whether to filter messages by specific servers",
    },
    {
      displayName: "Server Filter Method",
      name: "serverFilterMethod",
      type: "options",
      options: [
        {
          name: "From List",
          value: "fromList",
          description: "Select from servers the bot has joined",
        },
        {
          name: "By URL",
          value: "byUrl",
          description: "Filter by Discord server URL",
        },
        {
          name: "By ID",
          value: "byId",
          description: "Filter by server ID",
        },
      ],
      default: "fromList",
      description: "Method to filter servers",
      displayOptions: {
        show: {
          filterByServers: [true],
        },
      },
    },
    {
      displayName: "Server URL",
      name: "serverUrl",
      type: "string",
      default: "",
      description:
        "Discord server URL (e.g: https://discord.com/channels/820342303745900635)",
      displayOptions: {
        show: {
          filterByServers: [true],
          serverFilterMethod: ["byUrl"],
        },
      },
      placeholder: "https://discord.com/channels/820342303745900635",
    },
    {
      displayName: "Server ID",
      name: "serverId",
      type: "string",
      default: "",
      description: "Discord server ID",
      displayOptions: {
        show: {
          filterByServers: [true],
          serverFilterMethod: ["byId"],
        },
      },
      placeholder: "820342303745900635",
    },
    {
      displayName: "Server List",
      name: "serverIds",
      type: "multiOptions",
      typeOptions: {
        loadOptionsMethod: "getServers",
      },
      default: [],
      description: "Select servers from the list",
      displayOptions: {
        show: {
          filterByServers: [true],
          serverFilterMethod: ["fromList"],
        },
      },
    },
  ],
};
