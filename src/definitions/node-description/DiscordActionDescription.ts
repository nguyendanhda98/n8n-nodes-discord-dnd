import { INodeTypeDescription } from "n8n-workflow";
import { ActionEventType } from "../../Interfaces/types";
import { EmbedType } from "discord.js";
export const DiscordActionDescription: INodeTypeDescription = {
  displayName: "Discord Action DND",
  name: "discordActionDnd",
  icon: "file:../assets/icon/discord.svg",
  group: ["output"],
  version: 1,
  description: "Perform Discord bot actions",
  defaults: {
    name: "Discord Action DND",
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "discordApiDnd",
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
      options: [
        { name: "Message", value: "message" },
        { name: "Channel", value: "channel" },
        { name: "Role", value: "role" },
        { name: "Member", value: "member" },
      ],
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
      displayName: "Send as Direct Message",
      name: "sendAsDM",
      type: "boolean",
      default: false,
      description:
        "Whether to send the message as a direct message to a user instead of to a channel",
      displayOptions: {
        show: {
          action: [ActionEventType.SEND_TYPING, ActionEventType.SEND_MESSAGE],
        },
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
          action: [ActionEventType.SEND_TYPING, ActionEventType.SEND_MESSAGE],
          sendAsDM: [false],
        },
      },
    },
    {
      displayName: "User ID",
      name: "userId",
      type: "string",
      required: true,
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the user to send the direct message to",
      displayOptions: {
        show: {
          action: [ActionEventType.SEND_MESSAGE, ActionEventType.SEND_TYPING],
          sendAsDM: [true],
        },
      },
    },
    {
      displayName: "Message Content",
      name: "messageContent",
      type: "string",
      required: true,
      default: "",
      placeholder: "Hello, world!",
      description: "The content of the message to send",
      displayOptions: {
        show: {
          action: [ActionEventType.SEND_MESSAGE],
        },
      },
    },
    {
      displayName: "Options",
      name: "options",
      type: "collection",
      placeholder: "Add Option",
      default: {},
      options: [
        {
          displayName: "Message to Reply to",
          name: "messageId",
          type: "string",
          default: "",
          placeholder: "123456789012345678",
          description:
            "Fill this to make your message a reply. Add the message ID.",
        },
      ],
      displayOptions: {
        show: {
          action: [ActionEventType.SEND_MESSAGE],
        },
      },
    },
    {
      displayName: "Embeds",
      name: "embeds",
      type: "fixedCollection",
      typeOptions: {
        multipleValues: true,
      },
      placeholder: "Add Embed",
      default: {},
      options: [
        {
          name: "embed",
          displayName: "Embed",
          values: [
            {
              displayName: "Input Method",
              name: "inputMethod",
              type: "options",
              options: [
                {
                  name: "Enter Fields",
                  value: "fields",
                },
                {
                  name: "Raw JSON",
                  value: "json",
                },
              ],
              default: "fields",
              description:
                "Select how you want to input the message content and embeds.",
            },
            {
              displayName: "Title",
              name: "title",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The title of the embed",
            },
            {
              displayName: "type",
              name: "type",
              type: "options",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              default: EmbedType.Rich,
              description: "The type of embed to send",
              options: [
                {
                  name: "Rich",
                  value: EmbedType.Rich,
                },
                {
                  name: "Image",
                  value: EmbedType.Image,
                },
                {
                  name: "Video",
                  value: EmbedType.Video,
                },
                {
                  name: "Gifv",
                  value: EmbedType.GIFV,
                },
                {
                  name: "Article",
                  value: EmbedType.Article,
                },
                {
                  name: "Link",
                  value: EmbedType.Link,
                },
                {
                  name: "Poll Result",
                  value: EmbedType.PollResult,
                },
              ],
            },
            {
              displayName: "Description",
              name: "description",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The description of the embed",
            },
            {
              displayName: "URL",
              name: "url",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The URL of the embed",
            },
            {
              displayName: "Timestamp",
              name: "timestamp",
              type: "dateTime",
              default: "",
              description:
                "The timestamp to use for the embed. Leave blank for current time.",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
            },
            {
              displayName: "Color",
              name: "color",
              type: "number",
              default: 0,
              description:
                "The color of the embed in RGB format. For example, 0xFF5733 for red.",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
            },
            {
              displayName: "Footer Text",
              name: "footerText",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The text to display in the footer of the embed",
            },
            {
              displayName: "Footer Icon URL",
              name: "footerIconUrl",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description:
                "The URL of the icon to display in the footer of the embed",
            },
            {
              displayName: "Image URL",
              name: "imageUrl",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The URL of the image to include in the embed",
            },
            {
              displayName: "Thumbnail URL",
              name: "thumbnailUrl",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The URL of the thumbnail to include in the embed",
            },
            {
              displayName: "Provider Name",
              name: "providerName",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The name of the provider of the embed",
            },
            {
              displayName: "Provider URL",
              name: "providerUrl",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The URL of the provider of the embed",
            },
            {
              displayName: "Author Name",
              name: "authorName",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The name of the author of the embed",
            },
            {
              displayName: "Author URL",
              name: "authorUrl",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description: "The URL of the author of the embed",
            },
            {
              displayName: "Author Icon URL",
              name: "authorIconUrl",
              type: "string",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              description:
                "The URL of the icon to display next to the author of the embed",
            },
            {
              displayName: "Fields",
              name: "fields",
              type: "fixedCollection",
              placeholder: "Add Field",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              default: {},
              description:
                "The fields to include in the embed. Each field can have a name, value, and inline option.",
              typeOptions: {
                multipleValues: true,
              },
              options: [
                {
                  name: "field",
                  displayName: "Field",
                  values: [
                    {
                      displayName: "Name",
                      name: "name",
                      type: "string",
                      default: "",
                    },
                    {
                      displayName: "Value",
                      name: "value",
                      type: "string",
                      default: "",
                    },
                    {
                      displayName: "Inline",
                      name: "inline",
                      type: "boolean",
                      default: false,
                    },
                  ],
                },
              ],
            },
            {
              displayName: "video URL",
              name: "videoUrl",
              displayOptions: {
                show: {
                  inputMethod: ["fields"],
                },
              },
              type: "string",
              default: "",
              description:
                "The URL of the video to include in the embed. This will be ignored if the type is not video.",
            },
            {
              displayName: "JSON Payload",
              name: "jsonPayload",
              type: "json",
              default: "",
              displayOptions: {
                show: {
                  inputMethod: ["json"],
                },
              },
              description:
                "The JSON payload to send as the message. This will override all other fields.",
            },
          ],
        },
      ],
      description: " List of embeds to include in the message.",
      displayOptions: {
        show: {
          action: [ActionEventType.SEND_MESSAGE],
        },
      },
    },
    {
      displayName: "Message ID",
      name: "messageId",
      type: "string",
      required: true,
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the message to perform the action on",
      displayOptions: {
        show: {
          action: [
            ActionEventType.DELETE_MESSAGE,
            ActionEventType.EDIT_MESSAGE,
            ActionEventType.REACT_TO_MESSAGE,
            ActionEventType.REMOVE_REACTION,
            ActionEventType.PIN_MESSAGE,
            ActionEventType.UNPIN_MESSAGE,
          ],
        },
      },
    },
    {
      displayName: "New Content",
      name: "newContent",
      type: "string",
      required: true,
      default: "",
      placeholder: "Updated content",
      description: "The new content of the message",
      displayOptions: {
        show: {
          action: [ActionEventType.EDIT_MESSAGE],
        },
      },
    },
    {
      displayName: "Emoji",
      name: "emoji",
      type: "string",
      required: true,
      default: "👍",
      description:
        "The emoji to use as a reaction (Unicode emoji or custom emoji ID)",
      displayOptions: {
        show: {
          action: [
            ActionEventType.REACT_TO_MESSAGE,
            ActionEventType.REMOVE_REACTION,
          ],
        },
      },
    },
  ],
};
