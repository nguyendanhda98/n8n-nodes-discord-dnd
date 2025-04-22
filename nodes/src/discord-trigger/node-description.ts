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
      displayName: "Trigger Type",
      name: "triggerType",
      type: "options",
      options: [
        {
          name: "Message Content",
          value: "messageContent",
          description: "Triggered based on message content patterns",
        },
        {
          name: "Bot Interaction",
          value: "botInteraction",
          description: "Triggered when users interact with the bot",
        },
      ],
      default: "messageContent",
      required: true,
    },
    // Bot Interaction Options
    {
      displayName: "Interaction Type",
      name: "interactionType",
      type: "options",
      displayOptions: {
        show: {
          triggerType: ["botInteraction"],
        },
      },
      options: [
        {
          name: "Bot Mentioned",
          value: "botMentioned",
          description: "Triggered when someone mentions the bot in a message",
        },
        {
          name: "Message Replied To",
          value: "messageReplied",
          description:
            "Triggered when someone replies to a message from the bot",
        },
      ],
      default: "botMentioned",
      required: true,
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
