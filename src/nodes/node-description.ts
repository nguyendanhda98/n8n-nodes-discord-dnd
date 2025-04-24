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
      displayName: "Type",
      name: "type",
      type: "options",
      required: true,
      default: "message",
      description: "The type of Discord event to trigger on",
      options: [
        { name: "Message", value: "message" },
        { name: "Guild", value: "guild" },
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
        loadOptionsDependsOn: ["type"],
      },
    },
  ],
};
