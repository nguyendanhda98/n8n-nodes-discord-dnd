import { INodeTypeDescription } from "n8n-workflow";
import { ActionEventType, ActionType } from "../../Interfaces/types";
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
        { name: "Message", value: ActionType.MESSAGE },
        { name: "Scheduled Event", value: ActionType.SCHEDULED_EVENT },
        { name: "Channel", value: ActionType.CHANNEL },
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
          action: [ActionEventType.SEND_MESSAGE],
        },
      },
    },
    {
      displayName: "Channel Id",
      name: "channelId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the channel to send the action to",
      displayOptions: {
        show: {
          action: [
            ActionEventType.SEND_TYPING,
            ActionEventType.SEND_MESSAGE,
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
      displayName: "User ID",
      name: "userId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the user",
      displayOptions: {
        show: {
          action: [
            ActionEventType.SEND_MESSAGE,
            ActionEventType.SEND_TYPING,
            ActionEventType.REMOVE_REACTION,
          ],
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
    {
      displayName: "All",
      name: "all",
      type: "boolean",
      default: false,
      description:
        "Whether to remove all reactions from the message. Only applies to 'Remove Reaction' action.",
      displayOptions: {
        show: {
          action: [ActionEventType.REMOVE_REACTION],
        },
      },
    },
    {
      displayName: "Guild ID",
      name: "guildId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the guild (server) to perform the action in",
      required: true,
      displayOptions: {
        show: {
          action: [
            ActionEventType.GUILD_SCHEDULED_EVENT_UPDATE,
            ActionEventType.GET_GUILD_SCHEDULED_EVENT,
            ActionEventType.GET_MANY_GUILD_SCHEDULED_EVENTS,
            ActionEventType.CREATE_GUILD_SCHEDULED_EVENT,
            ActionEventType.UPDATE_GUILD_SCHEDULED_EVENT,
            ActionEventType.DELETE_GUILD_SCHEDULED_EVENT,
          ],
        },
      },
    },
    {
      displayName: "Event ID",
      name: "guildScheduledEventId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the scheduled event",
      required: true,
      displayOptions: {
        show: {
          action: [
            ActionEventType.GUILD_SCHEDULED_EVENT_UPDATE,
            ActionEventType.GET_GUILD_SCHEDULED_EVENT,
            ActionEventType.UPDATE_GUILD_SCHEDULED_EVENT,
            ActionEventType.DELETE_GUILD_SCHEDULED_EVENT,
          ],
        },
      },
    },
    // Create Event Fields
    {
      displayName: "Event Name",
      name: "eventName",
      type: "string",
      default: "",
      placeholder: "Weekly Meeting",
      description: "The name of the scheduled event",
      required: true,
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_GUILD_SCHEDULED_EVENT],
        },
      },
    },
    {
      displayName: "Start Time",
      name: "eventStartTime",
      type: "dateTime",
      default: "",
      description: "The start time of the event",
      required: true,
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_GUILD_SCHEDULED_EVENT],
        },
      },
    },
    {
      displayName: "Entity Type",
      name: "eventEntityType",
      type: "options",
      default: 2,
      description: "The entity type of the scheduled event",
      required: true,
      options: [
        { name: "Stage Instance", value: 1 },
        { name: "Voice", value: 2 },
        { name: "External", value: 3 },
      ],
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_GUILD_SCHEDULED_EVENT],
        },
      },
    },
    {
      displayName: "Privacy Level",
      name: "eventPrivacyLevel",
      type: "options",
      default: 2,
      description: "The privacy level of the scheduled event",
      required: true,
      options: [
        { name: "Guild Only", value: 2 },
      ],
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_GUILD_SCHEDULED_EVENT],
        },
      },
    },
    {
      displayName: "Channel ID",
      name: "eventChannelId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The channel ID for the event (required for Stage Instance and Voice)",
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_GUILD_SCHEDULED_EVENT],
          eventEntityType: [1, 2],
        },
      },
    },
    {
      displayName: "Event Options",
      name: "eventOptions",
      type: "collection",
      placeholder: "Add Option",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_GUILD_SCHEDULED_EVENT],
        },
      },
      options: [
        {
          displayName: "Description",
          name: "description",
          type: "string",
          default: "",
          description: "The description of the event",
        },
        {
          displayName: "End Time",
          name: "scheduledEndTime",
          type: "dateTime",
          default: "",
          description: "The end time of the event (required for External events)",
        },
        {
          displayName: "Entity Metadata Location",
          name: "entityMetadataLocation",
          type: "string",
          default: "",
          description: "The location of the event (required for External events)",
        },
        {
          displayName: "Image URL",
          name: "image",
          type: "string",
          default: "",
          description: "The cover image URL for the event",
        },
      ],
    },
    // Update Event Fields
    {
      displayName: "Update Fields",
      name: "eventUpdateFields",
      type: "collection",
      placeholder: "Add Field",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.UPDATE_GUILD_SCHEDULED_EVENT],
        },
      },
      options: [
        {
          displayName: "Name",
          name: "name",
          type: "string",
          default: "",
          description: "The new name of the event",
        },
        {
          displayName: "Description",
          name: "description",
          type: "string",
          default: "",
          description: "The new description of the event",
        },
        {
          displayName: "Start Time",
          name: "scheduledStartTime",
          type: "dateTime",
          default: "",
          description: "The new start time of the event",
        },
        {
          displayName: "End Time",
          name: "scheduledEndTime",
          type: "dateTime",
          default: "",
          description: "The new end time of the event",
        },
        {
          displayName: "Channel ID",
          name: "channelId",
          type: "string",
          default: "",
          description: "The new channel ID for the event",
        },
        {
          displayName: "Entity Type",
          name: "entityType",
          type: "options",
          default: 2,
          options: [
            { name: "Stage Instance", value: 1 },
            { name: "Voice", value: 2 },
            { name: "External", value: 3 },
          ],
          description: "The new entity type of the event",
        },
        {
          displayName: "Status",
          name: "status",
          type: "options",
          default: 1,
          options: [
            { name: "Scheduled", value: 1 },
            { name: "Active", value: 2 },
            { name: "Completed", value: 3 },
            { name: "Canceled", value: 4 },
          ],
          description: "The new status of the event",
        },
        {
          displayName: "Entity Metadata Location",
          name: "entityMetadataLocation",
          type: "string",
          default: "",
          description: "The new location for External events",
        },
        {
          displayName: "Image URL",
          name: "image",
          type: "string",
          default: "",
          description: "The new cover image URL",
        },
      ],
    },
    {
      displayName: "Update Fields",
      name: "updateFields",
      type: "collection",
      placeholder: "Add Field",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.GUILD_SCHEDULED_EVENT_UPDATE],
        },
      },
      options: [
        {
          displayName: "Name",
          name: "name",
          type: "string",
          default: "",
          description:
            "The name of the event. Leave blank to keep current name.",
        },
        {
          displayName: "Start Time",
          name: "scheduledStartTime",
          type: "dateTime",
          default: "",
          description:
            "The start time of the event. Leave blank to keep current start time.",
        },
        {
          displayName: "End Time",
          name: "scheduledEndTime",
          type: "dateTime",
          default: "",
          description:
            "The end time of the event. Leave blank to keep current end time.",
        },
        {
          displayName: "Description",
          name: "description",
          type: "string",
          default: "",
          description:
            "The description of the event. Leave blank to keep current description.",
        },
      ],
    },
    // Channel Action Fields
    {
      displayName: "Guild ID",
      name: "channelGuildId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the guild (server) where the channel is or will be",
      required: true,
      displayOptions: {
        show: {
          action: [
            ActionEventType.CREATE_CHANNEL,
            ActionEventType.GET_MANY_CHANNELS,
          ],
        },
      },
    },
    {
      displayName: "Channel ID",
      name: "targetChannelId",
      type: "string",
      default: "",
      placeholder: "123456789012345678",
      description: "The ID of the channel to perform the action on",
      required: true,
      displayOptions: {
        show: {
          action: [
            ActionEventType.DELETE_CHANNEL,
            ActionEventType.UPDATE_CHANNEL,
            ActionEventType.GET_CHANNEL,
          ],
        },
      },
    },
    {
      displayName: "Channel Name",
      name: "channelName",
      type: "string",
      default: "",
      placeholder: "general",
      description: "The name of the channel",
      required: true,
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_CHANNEL],
        },
      },
    },
    {
      displayName: "Channel Type",
      name: "channelType",
      type: "options",
      default: 0,
      description: "The type of channel to create",
      required: true,
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_CHANNEL],
        },
      },
      options: [
        {
          name: "Text Channel",
          value: 0,
        },
        {
          name: "Voice Channel",
          value: 2,
        },
        {
          name: "Category",
          value: 4,
        },
        {
          name: "Announcement Channel",
          value: 5,
        },
        {
          name: "Stage Channel",
          value: 13,
        },
        {
          name: "Forum Channel",
          value: 15,
        },
      ],
    },
    {
      displayName: "Channel Options",
      name: "channelOptions",
      type: "collection",
      placeholder: "Add Option",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_CHANNEL, ActionEventType.UPDATE_CHANNEL],
        },
      },
      options: [
        {
          displayName: "Topic",
          name: "topic",
          type: "string",
          default: "",
          description: "The topic of the channel",
        },
        {
          displayName: "Position",
          name: "position",
          type: "number",
          default: 0,
          description: "The position of the channel in the channel list",
        },
        {
          displayName: "NSFW",
          name: "nsfw",
          type: "boolean",
          default: false,
          description: "Whether the channel is marked as NSFW",
        },
        {
          displayName: "Bitrate",
          name: "bitrate",
          type: "number",
          default: 64000,
          description: "The bitrate of the voice channel (voice channels only)",
        },
        {
          displayName: "User Limit",
          name: "userLimit",
          type: "number",
          default: 0,
          description: "The user limit of the voice channel (0 = unlimited, voice channels only)",
        },
        {
          displayName: "Rate Limit Per User",
          name: "rateLimitPerUser",
          type: "number",
          default: 0,
          description: "The slowmode in seconds (0 to disable)",
        },
        {
          displayName: "Parent Category",
          name: "parent",
          type: "string",
          default: "",
          placeholder: "123456789012345678",
          description: "The ID of the parent category",
        },
        {
          displayName: "Inherit Parent Permissions",
          name: "inheritParentPermissions",
          type: "boolean",
          default: false,
          description: "Whether to inherit permissions from the parent category. Only works if Parent Category is set.",
        },
      ],
    },
    {
      displayName: "Permission Overwrites",
      name: "permissionOverwrites",
      type: "fixedCollection",
      typeOptions: {
        multipleValues: true,
      },
      placeholder: "Add Permission",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_CHANNEL, ActionEventType.UPDATE_CHANNEL],
        },
      },
      options: [
        {
          name: "permission",
          displayName: "Permission",
          values: [
            {
              displayName: "Target Type",
              name: "type",
              type: "options",
              default: "role",
              description: "Whether this permission is for a role or a member",
              options: [
                {
                  name: "Role",
                  value: "role",
                },
                {
                  name: "Member",
                  value: "member",
                },
              ],
            },
            {
              displayName: "Target ID",
              name: "id",
              type: "string",
              default: "",
              placeholder: "123456789012345678",
              description: "The ID of the role or member. Use guild ID for @everyone role.",
            },
            {
              displayName: "Allow Permissions",
              name: "allow",
              type: "multiOptions",
              default: [],
              description: "Permissions to explicitly allow",
              options: [
                { name: "View Channel", value: "ViewChannel" },
                { name: "Manage Channels", value: "ManageChannels" },
                { name: "Manage Permissions", value: "ManageRoles" },
                { name: "Manage Webhooks", value: "ManageWebhooks" },
                { name: "Create Invite", value: "CreateInstantInvite" },
                { name: "Send Messages", value: "SendMessages" },
                { name: "Send Messages in Threads", value: "SendMessagesInThreads" },
                { name: "Create Public Threads", value: "CreatePublicThreads" },
                { name: "Create Private Threads", value: "CreatePrivateThreads" },
                { name: "Embed Links", value: "EmbedLinks" },
                { name: "Attach Files", value: "AttachFiles" },
                { name: "Add Reactions", value: "AddReactions" },
                { name: "Use External Emojis", value: "UseExternalEmojis" },
                { name: "Use External Stickers", value: "UseExternalStickers" },
                { name: "Mention Everyone", value: "MentionEveryone" },
                { name: "Manage Messages", value: "ManageMessages" },
                { name: "Manage Threads", value: "ManageThreads" },
                { name: "Read Message History", value: "ReadMessageHistory" },
                { name: "Send TTS Messages", value: "SendTTSMessages" },
                { name: "Use Application Commands", value: "UseApplicationCommands" },
                { name: "Send Voice Messages", value: "SendVoiceMessages" },
                { name: "Connect (Voice)", value: "Connect" },
                { name: "Speak (Voice)", value: "Speak" },
                { name: "Stream (Voice)", value: "Stream" },
                { name: "Use Voice Activity", value: "UseVAD" },
                { name: "Priority Speaker", value: "PrioritySpeaker" },
                { name: "Mute Members", value: "MuteMembers" },
                { name: "Deafen Members", value: "DeafenMembers" },
                { name: "Move Members", value: "MoveMembers" },
                { name: "Use Soundboard", value: "UseSoundboard" },
                { name: "Use External Sounds", value: "UseExternalSounds" },
                { name: "Request to Speak (Stage)", value: "RequestToSpeak" },
              ],
            },
            {
              displayName: "Deny Permissions",
              name: "deny",
              type: "multiOptions",
              default: [],
              description: "Permissions to explicitly deny",
              options: [
                { name: "View Channel", value: "ViewChannel" },
                { name: "Manage Channels", value: "ManageChannels" },
                { name: "Manage Permissions", value: "ManageRoles" },
                { name: "Manage Webhooks", value: "ManageWebhooks" },
                { name: "Create Invite", value: "CreateInstantInvite" },
                { name: "Send Messages", value: "SendMessages" },
                { name: "Send Messages in Threads", value: "SendMessagesInThreads" },
                { name: "Create Public Threads", value: "CreatePublicThreads" },
                { name: "Create Private Threads", value: "CreatePrivateThreads" },
                { name: "Embed Links", value: "EmbedLinks" },
                { name: "Attach Files", value: "AttachFiles" },
                { name: "Add Reactions", value: "AddReactions" },
                { name: "Use External Emojis", value: "UseExternalEmojis" },
                { name: "Use External Stickers", value: "UseExternalStickers" },
                { name: "Mention Everyone", value: "MentionEveryone" },
                { name: "Manage Messages", value: "ManageMessages" },
                { name: "Manage Threads", value: "ManageThreads" },
                { name: "Read Message History", value: "ReadMessageHistory" },
                { name: "Send TTS Messages", value: "SendTTSMessages" },
                { name: "Use Application Commands", value: "UseApplicationCommands" },
                { name: "Send Voice Messages", value: "SendVoiceMessages" },
                { name: "Connect (Voice)", value: "Connect" },
                { name: "Speak (Voice)", value: "Speak" },
                { name: "Stream (Voice)", value: "Stream" },
                { name: "Use Voice Activity", value: "UseVAD" },
                { name: "Priority Speaker", value: "PrioritySpeaker" },
                { name: "Mute Members", value: "MuteMembers" },
                { name: "Deafen Members", value: "DeafenMembers" },
                { name: "Move Members", value: "MoveMembers" },
                { name: "Use Soundboard", value: "UseSoundboard" },
                { name: "Use External Sounds", value: "UseExternalSounds" },
                { name: "Request to Speak (Stage)", value: "RequestToSpeak" },
              ],
            },
          ],
        },
      ],
      description: "Set channel permission overwrites for roles or members",
    },
    {
      displayName: "Permission Add",
      name: "permissionAdd",
      type: "fixedCollection",
      typeOptions: {
        multipleValues: true,
      },
      placeholder: "Add Permission",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_CHANNEL, ActionEventType.UPDATE_CHANNEL],
        },
      },
      options: [
        {
          name: "permission",
          displayName: "Permission",
          values: [
            {
              displayName: "Target Type",
              name: "type",
              type: "options",
              default: "role",
              description: "Whether this permission is for a role or a member",
              options: [
                {
                  name: "Role",
                  value: "role",
                },
                {
                  name: "Member",
                  value: "member",
                },
              ],
            },
            {
              displayName: "Target ID",
              name: "id",
              type: "string",
              default: "",
              placeholder: "123456789012345678",
              description: "The ID of the role or member. Use guild ID for @everyone role.",
            },
            {
              displayName: "Allow Permissions",
              name: "allow",
              type: "multiOptions",
              default: [],
              description: "Permissions to explicitly allow (will be added to existing permissions)",
              options: [
                { name: "View Channel", value: "ViewChannel" },
                { name: "Manage Channels", value: "ManageChannels" },
                { name: "Manage Permissions", value: "ManageRoles" },
                { name: "Manage Webhooks", value: "ManageWebhooks" },
                { name: "Create Invite", value: "CreateInstantInvite" },
                { name: "Send Messages", value: "SendMessages" },
                { name: "Send Messages in Threads", value: "SendMessagesInThreads" },
                { name: "Create Public Threads", value: "CreatePublicThreads" },
                { name: "Create Private Threads", value: "CreatePrivateThreads" },
                { name: "Embed Links", value: "EmbedLinks" },
                { name: "Attach Files", value: "AttachFiles" },
                { name: "Add Reactions", value: "AddReactions" },
                { name: "Use External Emojis", value: "UseExternalEmojis" },
                { name: "Use External Stickers", value: "UseExternalStickers" },
                { name: "Mention Everyone", value: "MentionEveryone" },
                { name: "Manage Messages", value: "ManageMessages" },
                { name: "Manage Threads", value: "ManageThreads" },
                { name: "Read Message History", value: "ReadMessageHistory" },
                { name: "Send TTS Messages", value: "SendTTSMessages" },
                { name: "Use Application Commands", value: "UseApplicationCommands" },
                { name: "Send Voice Messages", value: "SendVoiceMessages" },
                { name: "Connect (Voice)", value: "Connect" },
                { name: "Speak (Voice)", value: "Speak" },
                { name: "Stream (Voice)", value: "Stream" },
                { name: "Use Voice Activity", value: "UseVAD" },
                { name: "Priority Speaker", value: "PrioritySpeaker" },
                { name: "Mute Members", value: "MuteMembers" },
                { name: "Deafen Members", value: "DeafenMembers" },
                { name: "Move Members", value: "MoveMembers" },
                { name: "Use Soundboard", value: "UseSoundboard" },
                { name: "Use External Sounds", value: "UseExternalSounds" },
                { name: "Request to Speak (Stage)", value: "RequestToSpeak" },
              ],
            },
            {
              displayName: "Deny Permissions",
              name: "deny",
              type: "multiOptions",
              default: [],
              description: "Permissions to explicitly deny (will be added to existing permissions)",
              options: [
                { name: "View Channel", value: "ViewChannel" },
                { name: "Manage Channels", value: "ManageChannels" },
                { name: "Manage Permissions", value: "ManageRoles" },
                { name: "Manage Webhooks", value: "ManageWebhooks" },
                { name: "Create Invite", value: "CreateInstantInvite" },
                { name: "Send Messages", value: "SendMessages" },
                { name: "Send Messages in Threads", value: "SendMessagesInThreads" },
                { name: "Create Public Threads", value: "CreatePublicThreads" },
                { name: "Create Private Threads", value: "CreatePrivateThreads" },
                { name: "Embed Links", value: "EmbedLinks" },
                { name: "Attach Files", value: "AttachFiles" },
                { name: "Add Reactions", value: "AddReactions" },
                { name: "Use External Emojis", value: "UseExternalEmojis" },
                { name: "Use External Stickers", value: "UseExternalStickers" },
                { name: "Mention Everyone", value: "MentionEveryone" },
                { name: "Manage Messages", value: "ManageMessages" },
                { name: "Manage Threads", value: "ManageThreads" },
                { name: "Read Message History", value: "ReadMessageHistory" },
                { name: "Send TTS Messages", value: "SendTTSMessages" },
                { name: "Use Application Commands", value: "UseApplicationCommands" },
                { name: "Send Voice Messages", value: "SendVoiceMessages" },
                { name: "Connect (Voice)", value: "Connect" },
                { name: "Speak (Voice)", value: "Speak" },
                { name: "Stream (Voice)", value: "Stream" },
                { name: "Use Voice Activity", value: "UseVAD" },
                { name: "Priority Speaker", value: "PrioritySpeaker" },
                { name: "Mute Members", value: "MuteMembers" },
                { name: "Deafen Members", value: "DeafenMembers" },
                { name: "Move Members", value: "MoveMembers" },
                { name: "Use Soundboard", value: "UseSoundboard" },
                { name: "Use External Sounds", value: "UseExternalSounds" },
                { name: "Request to Speak (Stage)", value: "RequestToSpeak" },
              ],
            },
          ],
        },
      ],
      description: "Add permissions to existing channel permissions for roles or members (keeps existing permissions)",
    },
    {
      displayName: "Permission Remove",
      name: "permissionRemove",
      type: "fixedCollection",
      typeOptions: {
        multipleValues: true,
      },
      placeholder: "Remove Permission",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.CREATE_CHANNEL, ActionEventType.UPDATE_CHANNEL],
        },
      },
      options: [
        {
          name: "permission",
          displayName: "Permission",
          values: [
            {
              displayName: "Target Type",
              name: "type",
              type: "options",
              default: "role",
              description: "Whether this permission is for a role or a member",
              options: [
                {
                  name: "Role",
                  value: "role",
                },
                {
                  name: "Member",
                  value: "member",
                },
              ],
            },
            {
              displayName: "Target ID",
              name: "id",
              type: "string",
              default: "",
              placeholder: "123456789012345678",
              description: "The ID of the role or member to remove permissions from",
            },
          ],
        },
      ],
      description: "Remove permission overwrites for specific roles or members from the channel",
    },
    {
      displayName: "Limit",
      name: "limit",
      type: "number",
      default: 50,
      description: "Maximum number of channels to retrieve (0 for all)",
      displayOptions: {
        show: {
          action: [ActionEventType.GET_MANY_CHANNELS],
        },
      },
    },
    {
      displayName: "Filter",
      name: "channelFilter",
      type: "collection",
      placeholder: "Add Filter",
      default: {},
      displayOptions: {
        show: {
          action: [ActionEventType.GET_MANY_CHANNELS],
        },
      },
      options: [
        {
          displayName: "Channel Type",
          name: "type",
          type: "options",
          default: "",
          description: "Filter by channel type",
          options: [
            {
              name: "All",
              value: "",
            },
            {
              name: "Text Channel",
              value: 0,
            },
            {
              name: "Voice Channel",
              value: 2,
            },
            {
              name: "Category",
              value: 4,
            },
            {
              name: "Announcement Channel",
              value: 5,
            },
            {
              name: "Stage Channel",
              value: 13,
            },
            {
              name: "Forum Channel",
              value: 15,
            },
          ],
        },
        {
          displayName: "Name Contains",
          name: "nameContains",
          type: "string",
          default: "",
          description: "Filter channels by name (partial match)",
        },
      ],
    },
  ],
};
