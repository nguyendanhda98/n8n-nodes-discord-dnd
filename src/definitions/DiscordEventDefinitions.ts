import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { Events } from "discord.js";

export const methods = {
  loadOptions: {
    async getEvents(
      this: ILoadOptionsFunctions
    ): Promise<INodePropertyOptions[]> {
      const type = this.getCurrentNodeParameter("triggerType") as string;

      const eventOptions: { [key: string]: INodePropertyOptions[] } = {
        message: [
          { name: "Message Create", value: Events.MessageCreate },
          { name: "Message Delete", value: Events.MessageDelete },
          { name: "Message Delete Bulk", value: Events.MessageBulkDelete },
          { name: "Message Update", value: Events.MessageUpdate },
          { name: "Message Reaction Add", value: Events.MessageReactionAdd },
          {
            name: "Message Reaction Remove",
            value: Events.MessageReactionRemove,
          },
          {
            name: "Message Reaction Remove All",
            value: Events.MessageReactionRemoveAll,
          },
          {
            name: "Message Reaction Remove Emoji",
            value: Events.MessageReactionRemoveEmoji,
          },
          { name: "Typing Start", value: Events.TypingStart },
        ],
        guild: [
          { name: "Channel Create", value: Events.ChannelCreate },
          { name: "Channel Delete", value: Events.ChannelDelete },
          { name: "Channel Pins Update", value: Events.ChannelPinsUpdate },
          { name: "Channel Update", value: Events.ChannelUpdate },
          { name: "Guild Available", value: Events.GuildAvailable },
          { name: "Guild Create", value: Events.GuildCreate },
          { name: "Guild Delete", value: Events.GuildDelete },
          { name: "Guild Unavailable", value: Events.GuildUnavailable },
          { name: "Guild Update", value: Events.GuildUpdate },
          { name: "Role Create", value: Events.GuildRoleCreate },
          { name: "Role Delete", value: Events.GuildRoleDelete },
          { name: "Role Update", value: Events.GuildRoleUpdate },
          { name: "Stage Instance Create", value: Events.StageInstanceCreate },
          { name: "Stage Instance Delete", value: Events.StageInstanceDelete },
          { name: "Stage Instance Update", value: Events.StageInstanceUpdate },
          { name: "Thread Create", value: Events.ThreadCreate },
          { name: "Thread Delete", value: Events.ThreadDelete },
          { name: "Thread List Sync", value: Events.ThreadListSync },
          { name: "Thread Members Update", value: Events.ThreadMembersUpdate },
          { name: "Thread Member Update", value: Events.ThreadMemberUpdate },
          { name: "Thread Update", value: Events.ThreadUpdate },
        ],
        moderation: [
          { name: "Guild Ban Add", value: Events.GuildBanAdd },
          { name: "Guild Ban Remove", value: Events.GuildBanRemove },
          {
            name: "Guild Audit Log Entry Create",
            value: Events.GuildAuditLogEntryCreate,
          },
        ],
        emojiSticker: [
          { name: "Emoji Create", value: Events.GuildEmojiCreate },
          { name: "Emoji Delete", value: Events.GuildEmojiDelete },
          { name: "Emoji Update", value: Events.GuildEmojiUpdate },
          { name: "Sticker Create", value: Events.GuildStickerCreate },
          { name: "Sticker Delete", value: Events.GuildStickerDelete },
          { name: "Sticker Update", value: Events.GuildStickerUpdate },
        ],
        integrationWebhook: [
          {
            name: "Guild Integrations Update",
            value: Events.GuildIntegrationsUpdate,
          },
          { name: "Webhook Update", value: Events.WebhooksUpdate },
        ],
        invite: [
          { name: "Invite Create", value: Events.InviteCreate },
          { name: "Invite Delete", value: Events.InviteDelete },
        ],
        voice: [{ name: "Voice State Update", value: Events.VoiceStateUpdate }],
        presence: [{ name: "Presence Update", value: Events.PresenceUpdate }],
        scheduledEvent: [
          {
            name: "Guild Scheduled Event Create",
            value: Events.GuildScheduledEventCreate,
          },
          {
            name: "Guild Scheduled Event Delete",
            value: Events.GuildScheduledEventDelete,
          },
          {
            name: "Guild Scheduled Event Update",
            value: Events.GuildScheduledEventUpdate,
          },
          {
            name: "Guild Scheduled Event User Add",
            value: Events.GuildScheduledEventUserAdd,
          },
          {
            name: "Guild Scheduled Event User Remove",
            value: Events.GuildScheduledEventUserRemove,
          },
        ],
        interaction: [
          { name: "Interaction Create", value: Events.InteractionCreate },
          {
            name: "Application Command Permissions Update",
            value: Events.ApplicationCommandPermissionsUpdate,
          },
        ],
        botStatus: [
          { name: "Debug", value: Events.Debug },
          { name: "Error", value: Events.Error },
          { name: "Warn", value: Events.Warn },
          { name: "Ready", value: Events.ClientReady },
          { name: "Shard Disconnect", value: Events.ShardDisconnect },
          { name: "Shard Error", value: Events.ShardError },
          { name: "Shard Ready", value: Events.ShardReady },
          { name: "Shard Reconnecting", value: Events.ShardReconnecting },
          { name: "Shard Resume", value: Events.ShardResume },
        ],
        user: [
          { name: "User Update", value: Events.UserUpdate },
          { name: "Guild Member Add", value: Events.GuildMemberAdd },
          {
            name: "Guild Member Available",
            value: Events.GuildMemberAvailable,
          },
          { name: "Guild Member Remove", value: Events.GuildMemberRemove },
          { name: "Guild Member Update", value: Events.GuildMemberUpdate },
          { name: "Guild Members Chunk", value: Events.GuildMembersChunk },
        ],
        autoModeration: [
          {
            name: "Auto Moderation Action Execution",
            value: Events.AutoModerationActionExecution,
          },
          {
            name: "Auto Moderation Rule Create",
            value: Events.AutoModerationRuleCreate,
          },
          {
            name: "Auto Moderation Rule Delete",
            value: Events.AutoModerationRuleDelete,
          },
          {
            name: "Auto Moderation Rule Update",
            value: Events.AutoModerationRuleUpdate,
          },
        ],
        poll: [
          { name: "Message Poll Vote Add", value: Events.MessagePollVoteAdd },
          {
            name: "Message Poll Vote Remove",
            value: Events.MessagePollVoteRemove,
          },
        ],
      };

      return eventOptions[type] || [];
    },
  },
};
