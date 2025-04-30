import { INodeTypeDescription } from "n8n-workflow";
export const DiscordActionDescription: INodeTypeDescription = {
  displayName: "Discord Action",
  name: "discordAction",
  icon: "file:../assets/icon/discord.svg",
  group: ["output"],
  version: 1,
  description: "Perform Discord bot actions",
  defaults: {
    name: "Discord Action",
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "discordApi",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Action Type",
      name: "actionType",
      type: "options",
      required: true,
      default: "message",
      description: "The type of Discord event to action on",
      options: [{ name: "Message", value: "message" }],
    },
    {
      displayName: "Action",
      name: "action",
      type: "options",
      required: true,
      default: "",
      description: "The specific Discord event to listen for",
      typeOptions: {
        loadOptionsMethod: "sendActions",
        loadOptionsDependsOn: ["actionType"],
      },
    },
    {
      displayName: "Channel Id",
      name: "channelId",
      type: "string",
      required: true,
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the channel to send the action to",
      displayOptions: {
        show: {
          action: ["sendTyping"],
        },
      },
    },
  ],
};
