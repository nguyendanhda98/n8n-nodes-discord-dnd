import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";

export const methods = {
  loadOptions: {
    async getEvents(
      this: ILoadOptionsFunctions
    ): Promise<INodePropertyOptions[]> {
      const type = this.getCurrentNodeParameter("triggerType") as string;

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
