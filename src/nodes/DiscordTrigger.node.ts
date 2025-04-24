import {
  INodeType,
  ITriggerFunctions,
  ITriggerResponse,
  ICredentialDataDecryptedObject,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  IDataObject,
} from "n8n-workflow";
import { initializeDiscordClient } from "./client";
import { nodeDescription } from "./node-description";
import { ITriggerParameters } from "./types";
import { GatewayIntentBits } from "discord.js";

/**
 * Discord Trigger node for n8n
 * This is the main entry point for the node
 */
export class DiscordTrigger implements INodeType {
  description = nodeDescription;

  methods = {
    loadOptions: {
      async getEvents(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const type = this.getCurrentNodeParameter("type") as string;

        const eventOptions: { [key: string]: INodePropertyOptions[] } = {
          message: [
            { name: "Message Create", value: "messageCreate" },
            { name: "Message Delete", value: "messageDelete" },
            { name: "Message Delete Bulk", value: "messageDeleteBulk" },
            { name: "Message Update", value: "messageUpdate" },
            { name: "Message Reaction Add", value: "messageReactionAdd" },
            { name: "Message Reaction Remove", value: "messageReactionRemove" },
            {
              name: "Message Reaction Remove All",
              value: "messageReactionRemoveAll",
            },
            {
              name: "Message Reaction Remove Emoji",
              value: "messageReactionRemoveEmoji",
            },
            { name: "Typing Start", value: "typingStart" },
          ],
          guild: [
            { name: "Channel Create", value: "channelCreate" },
            { name: "Channel Delete", value: "channelDelete" },
            { name: "Channel Pins Update", value: "channelPinsUpdate" },
            { name: "Channel Update", value: "channelUpdate" },
            { name: "Guild Available", value: "guildAvailable" },
            { name: "Guild Create", value: "guildCreate" },
            { name: "Guild Delete", value: "guildDelete" },
            { name: "Guild Unavailable", value: "guildUnavailable" },
            { name: "Guild Update", value: "guildUpdate" },
            { name: "Role Create", value: "roleCreate" },
            { name: "Role Delete", value: "roleDelete" },
            { name: "Role Update", value: "roleUpdate" },
            { name: "Stage Instance Create", value: "stageInstanceCreate" },
            { name: "Stage Instance Delete", value: "stageInstanceDelete" },
            { name: "Stage Instance Update", value: "stageInstanceUpdate" },
            { name: "Thread Create", value: "threadCreate" },
            { name: "Thread Delete", value: "threadDelete" },
            { name: "Thread List Sync", value: "threadListSync" },
            { name: "Thread Members Update", value: "threadMembersUpdate" },
            { name: "Thread Member Update", value: "threadMemberUpdate" },
            { name: "Thread Update", value: "threadUpdate" },
          ],
          moderation: [
            { name: "Guild Ban Add", value: "guildBanAdd" },
            { name: "Guild Ban Remove", value: "guildBanRemove" },
            {
              name: "Guild Audit Log Entry Create",
              value: "guildAuditLogEntryCreate",
            },
          ],
          emojiSticker: [
            { name: "Emoji Create", value: "emojiCreate" },
            { name: "Emoji Delete", value: "emojiDelete" },
            { name: "Emoji Update", value: "emojiUpdate" },
            { name: "Sticker Create", value: "stickerCreate" },
            { name: "Sticker Delete", value: "stickerDelete" },
            { name: "Sticker Update", value: "stickerUpdate" },
          ],
          integrationWebhook: [
            {
              name: "Guild Integrations Update",
              value: "guildIntegrationsUpdate",
            },
            { name: "Webhook Update", value: "webhookUpdate" },
          ],
          invite: [
            { name: "Invite Create", value: "inviteCreate" },
            { name: "Invite Delete", value: "inviteDelete" },
          ],
          voice: [
            {
              name: "Voice Channel Effect Send",
              value: "voiceChannelEffectSend",
            },
            { name: "Voice State Update", value: "voiceStateUpdate" },
          ],
          presence: [{ name: "Presence Update", value: "presenceUpdate" }],
          scheduledEvent: [
            {
              name: "Guild Scheduled Event Create",
              value: "guildScheduledEventCreate",
            },
            {
              name: "Guild Scheduled Event Delete",
              value: "guildScheduledEventDelete",
            },
            {
              name: "Guild Scheduled Event Update",
              value: "guildScheduledEventUpdate",
            },
            {
              name: "Guild Scheduled Event User Add",
              value: "guildScheduledEventUserAdd",
            },
            {
              name: "Guild Scheduled Event User Remove",
              value: "guildScheduledEventUserRemove",
            },
          ],
          interaction: [
            { name: "Interaction Create", value: "interactionCreate" },
            {
              name: "Application Command Permissions Update",
              value: "applicationCommandPermissionsUpdate",
            },
          ],
          botStatus: [
            { name: "Debug", value: "debug" },
            { name: "Error", value: "error" },
            { name: "Warn", value: "warn" },
            { name: "Ready", value: "ready" },
            { name: "Shard Disconnect", value: "shardDisconnect" },
            { name: "Shard Error", value: "shardError" },
            { name: "Shard Ready", value: "shardReady" },
            { name: "Shard Reconnecting", value: "shardReconnecting" },
            { name: "Shard Resume", value: "shardResume" },
          ],
          user: [
            { name: "User Update", value: "userUpdate" },
            { name: "Guild Member Add", value: "guildMemberAdd" },
            { name: "Guild Member Available", value: "guildMemberAvailable" },
            { name: "Guild Member Remove", value: "guildMemberRemove" },
            { name: "Guild Member Update", value: "guildMemberUpdate" },
            { name: "Guild Members Chunk", value: "guildMembersChunk" },
          ],
          autoModeration: [
            {
              name: "Auto Moderation Action Execution",
              value: "autoModerationActionExecution",
            },
            {
              name: "Auto Moderation Rule Create",
              value: "autoModerationRuleCreate",
            },
            {
              name: "Auto Moderation Rule Delete",
              value: "autoModerationRuleDelete",
            },
            {
              name: "Auto Moderation Rule Update",
              value: "autoModerationRuleUpdate",
            },
          ],
          poll: [
            { name: "Message Poll Vote Add", value: "messagePollVoteAdd" },
            {
              name: "Message Poll Vote Remove",
              value: "messagePollVoteRemove",
            },
          ],
        };

        return eventOptions[type] || [];
      },
    },
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = (await this.getCredentials(
      "discordApi"
    )) as ICredentialDataDecryptedObject;

    // Extract parameters from node configuration
    const parameters: ITriggerParameters = {
      type: this.getNodeParameter("type", "message") as string,
      event: this.getNodeParameter("event", "messageCreate") as string,
    };

    // Define GatewayIntentBits based on type and event
    let intents: GatewayIntentBits[] = [];

    switch (parameters.type) {
      case "message":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.DirectMessageReactions,
        ];
        break;

      case "guild":
        intents = [GatewayIntentBits.Guilds];
        break;

      case "moderation":
        intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration];
        break;

      case "emojiSticker":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildExpressions,
        ];
        break;

      case "integrationWebhook":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildIntegrations,
          GatewayIntentBits.GuildWebhooks,
        ];
        break;

      case "invite":
        intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildInvites];
        break;

      case "voice":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildVoiceStates,
        ];
        break;

      case "presence":
        intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences];
        break;

      case "scheduledEvent":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildScheduledEvents,
        ];
        break;

      case "interaction":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildIntegrations,
        ];
        break;

      case "botStatus":
        intents = []; // No intents needed for bot status events
        break;

      case "user":
        intents =
          parameters.event === "userUpdate"
            ? [] // userUpdate doesn't need intents
            : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers];
        break;

      case "autoModeration":
        intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration];
        break;

      case "poll":
        intents = [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMessagePolls,
        ];
        break;

      default:
        throw new Error(`Unsupported type: ${parameters.type}`);
    }

    // Initialize Discord client with specific intents
    const client = await initializeDiscordClient(
      credentials.botToken as string,
      intents
    );

    // Set up response data with manual trigger function
    const responseData: ITriggerResponse = {
      manualTriggerFunction: async () => {
        return;
      },
    };

    // Set up event handler based on the selected event
    const setupEventHandler = (event: string) => {
      client.on(event, (...args: any[]) => {
        const data: IDataObject = {};

        switch (event) {
          case "messageCreate":
          case "messageUpdate":
          case "messageDelete":
          case "messageReactionRemoveAll":
          case "messageReactionRemoveEmoji":
            data.message = args[0];
            break;

          case "messageDeleteBulk":
            data.messages = args[0];
            break;

          case "messageReactionAdd":
          case "messageReactionRemove":
            data.reaction = args[0];
            data.user = args[1];
            break;

          case "typingStart":
            data.typing = args[0];
            break;

          case "channelCreate":
          case "channelDelete":
          case "channelPinsUpdate":
          case "channelUpdate":
            data.channel = args[0];
            break;

          case "guildAvailable":
          case "guildCreate":
          case "guildDelete":
          case "guildUnavailable":
          case "guildUpdate":
            data.guild = args[0];
            break;

          case "roleCreate":
          case "roleDelete":
          case "roleUpdate":
            data.role = args[0];
            break;

          case "stageInstanceCreate":
          case "stageInstanceDelete":
          case "stageInstanceUpdate":
            data.stageInstance = args[0];
            break;

          case "threadCreate":
          case "threadDelete":
          case "threadUpdate":
            data.thread = args[0];
            break;

          case "threadListSync":
            data.threadList = args[0];
            break;

          case "threadMembersUpdate":
            data.threadMembers = args[0];
            break;

          case "threadMemberUpdate":
            data.threadMember = args[0];
            break;

          case "guildBanAdd":
          case "guildBanRemove":
            data.ban = args[0];
            break;

          case "guildAuditLogEntryCreate":
            data.auditLogEntry = args[0];
            break;

          case "emojiCreate":
          case "emojiDelete":
          case "emojiUpdate":
            data.emoji = args[0];
            break;

          case "stickerCreate":
          case "stickerDelete":
          case "stickerUpdate":
            data.sticker = args[0];
            break;

          case "guildIntegrationsUpdate":
            data.guild = args[0];
            break;

          case "webhookUpdate":
            data.channel = args[0];
            break;

          case "inviteCreate":
          case "inviteDelete":
            data.invite = args[0];
            break;

          case "voiceChannelEffectSend":
            data.voiceEffect = args[0];
            break;

          case "voiceStateUpdate":
            data.voiceState = args[0];
            break;

          case "presenceUpdate":
            data.oldPresence = args[0];
            data.newPresence = args[1];
            break;

          case "guildScheduledEventCreate":
          case "guildScheduledEventDelete":
          case "guildScheduledEventUpdate":
            data.scheduledEvent = args[0];
            break;

          case "guildScheduledEventUserAdd":
          case "guildScheduledEventUserRemove":
            data.scheduledEvent = args[0];
            data.user = args[1];
            break;

          case "interactionCreate":
            data.interaction = args[0];
            break;

          case "applicationCommandPermissionsUpdate":
            data.commandPermissions = args[0];
            break;

          case "debug":
          case "error":
          case "warn":
          case "ready":
          case "shardDisconnect":
          case "shardError":
          case "shardReady":
          case "shardReconnecting":
          case "shardResume":
            data.eventData = args[0];
            break;

          case "userUpdate":
            data.oldUser = args[0];
            data.newUser = args[1];
            break;

          case "guildMemberAdd":
          case "guildMemberRemove":
          case "guildMemberAvailable":
            data.member = args[0];
            break;

          case "guildMemberUpdate":
            data.oldMember = args[0];
            data.newMember = args[1];
            break;

          case "guildMembersChunk":
            data.membersChunk = args[0];
            break;

          case "autoModerationActionExecution":
          case "autoModerationRuleCreate":
          case "autoModerationRuleDelete":
          case "autoModerationRuleUpdate":
            data.autoModeration = args[0];
            break;

          case "messagePollVoteAdd":
          case "messagePollVoteRemove":
            data.pollVote = args[0];
            break;

          default:
            data.eventArgs = args;
            break;
        }

        // Emit the event data (no filters)
        this.emit([this.helpers.returnJsonArray([data])]);
      });
    };

    setupEventHandler(parameters.event);

    const closeFunction = async () => {
      console.log("Disconnecting from Discord...");
      client.destroy();
    };

    return {
      ...responseData,
      closeFunction,
    };
  }
}
