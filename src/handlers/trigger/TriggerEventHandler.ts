import {
  Client,
  GuildChannel,
  Message,
  GuildMember,
  Role,
  Guild,
  MessageReaction,
  User,
  Collection,
  ThreadChannel,
  StageInstance,
  GuildBan,
  Emoji,
  Sticker,
  VoiceState,
  Presence,
  GuildScheduledEvent,
  AutoModerationRule,
  AutoModerationActionExecution,
  GuildAuditLogsEntry,
  TextChannel,
  NewsChannel,
  VoiceChannel,
  StageChannel,
  ForumChannel,
  MediaChannel,
  Invite,
  VoiceChannelEffect,
  GuildTextBasedChannel,
  TextBasedChannels,
  ApplicationCommandPermissionsUpdateData,
  Events,
  CloseEvent,
  GuildMembersChunk,
  PollAnswer,
  MessageReactionEventDetails,
  Typing,
  DMChannel,
  ThreadMember,
  GuildEmoji,
  BaseInteraction,
} from "discord.js";
import { ITriggerFunctions, IDataObject } from "n8n-workflow";
import { messageToJson } from "../../transformers/MessageTransformer";

export class TriggerEventHandler {
  constructor(
    private readonly client: Client,
    private readonly triggerInstance: ITriggerFunctions
  ) {}

  async setupEventHandler(event: string) {
    // Handle main events
    this.client.on(event, async (...args: any[]) => {
      const data: IDataObject = {};

      // Helper to enrich user/member info with roles
      const enrichMember = async (memberOrUser: any, guildId?: string) => {
        if (!memberOrUser) return null;

        const guild = guildId ? this.client.guilds.cache.get(guildId) : null;
        const member = guild
          ? await guild.members.fetch(memberOrUser.id).catch(() => null)
          : null;

        return {
          ...memberOrUser,
          roles:
            member?.roles.cache.map((role: Role) => ({
              ...role,
            })) || [],
        };
      };

      switch (event) {
        // Message events
        case Events.MessageCreate:
          const message: Message = args[0];
          data.message = await messageToJson(message);

          // Use the guild ID from the message when enriching the author
          if (message.author && message.guildId) {
            data.user = await enrichMember(message.author, message.guildId);
          } else {
            data.user = { ...message.author };
          }
          break;

        case Events.MessageDelete:
          const deletedMessage: Message = args[0];
          data.message = { ...deletedMessage };
          break;

        case Events.MessageBulkDelete:
          const deletedMessages = args[0]; // Collection<Snowflake, Message>
          const channelMessageDeleteBulk: GuildTextBasedChannel = args[1]; // TextBasedChannel

          // Trích xuất thông tin kênh
          data.channel = {
            ...channelMessageDeleteBulk,
          };

          // Trích xuất danh sách tin nhắn bị xóa
          data.deletedMessages = deletedMessages.map((message: Message) => ({
            ...message,
          }));

          // Tổng số tin nhắn bị xóa
          data.deletedCount = deletedMessages.size;

          break;

        case Events.MessageUpdate:
          const oldMessage: Message = args[0];
          const newMessage: Message = args[1];
          data.oldMessage = { ...oldMessage };
          data.newMessage = { ...newMessage };
          break;

        case Events.MessageReactionAdd:
        case Events.MessageReactionRemove:
          const messageReaction: MessageReaction = args[0];
          const reactUser: User = args[1];
          const details: MessageReactionEventDetails = args[2]; //  MessageReactionEventDetails

          data.messageReaction = {
            ...messageReaction,
            message: await messageReaction.message.fetch(),
          };
          data.user = await enrichMember(
            reactUser,
            messageReaction.message.guildId || undefined
          );
          data.details = { ...details };
          break;

        case Events.MessageReactionRemoveAll:
          const messageReactionRemoved: Message = args[0];
          const reactions = args[1]; // Collection<Snowflake, MessageReaction>
          data.message = { ...messageReactionRemoved };
          data.reactions = reactions.map((reaction: MessageReaction) => ({
            ...reaction,
          }));

          break;

        case Events.MessageReactionRemoveEmoji:
          const reactionMessageReactionRemoveEmoji: MessageReaction = args[0]; // MessageReaction

          // Trích xuất thông tin tin nhắn và reaction
          data.reaction = {
            ...reactionMessageReactionRemoveEmoji,
          };

          break;

        case Events.TypingStart:
          const typing: Typing = args[0];
          data.typing = { ...typing };
          if (typing.user) {
            data.user = await enrichMember(typing.user);
          }
          break;

        // Guild events
        case Events.ChannelCreate:
          const channel: GuildChannel = args[0];
          data.channel = { ...channel };
          break;

        case Events.ChannelDelete:
          const deletedChannel: DMChannel | GuildChannel = args[0];
          data.channel = { ...deletedChannel };
          break;
        case Events.ChannelPinsUpdate:
          const pinsChannel: TextBasedChannels = args[0]; // GuildChannel hoặc ThreadChannel
          const pinTimestamp: Date = args[1]; // Date

          // Trích xuất thông tin cơ bản của channel
          data.channel = {
            ...pinsChannel,
          };
          data.pinTimestamp = pinTimestamp.toISOString(); // Chuyển Date thành chuỗi ISO để serialize

          // Fetch danh sách tin nhắn ghim từ kênh
          try {
            const pinnedMessages = await pinsChannel.messages.fetchPinned();

            // Lấy tin nhắn ghim mới nhất (giả định là tin nhắn vừa được ghim)
            const latestPinnedMessage = pinnedMessages.last(); // Tin nhắn cuối cùng trong danh sách

            if (latestPinnedMessage) {
              // Trích xuất thông tin chi tiết từ tin nhắn ghim
              data.pinnedMessage = {
                id: latestPinnedMessage.id,
                content: latestPinnedMessage.content,
                channelId: latestPinnedMessage.channelId,
                guildId: latestPinnedMessage.guildId,
                createdTimestamp: latestPinnedMessage.createdTimestamp,
                author: {
                  id: latestPinnedMessage.author?.id,
                  username: latestPinnedMessage.author?.username,
                  discriminator: latestPinnedMessage.author?.discriminator,
                  globalName: latestPinnedMessage.author?.globalName,
                  avatar: latestPinnedMessage.author?.avatar,
                  bot: latestPinnedMessage.author?.bot,
                },
                pinned: latestPinnedMessage.pinned, // Phải là true vì đây là tin nhắn ghim
                pinnedAt: pinTimestamp.toISOString(), // Thời gian ghim (dùng pinTimestamp từ sự kiện)
              };

              // Nếu tin nhắn thuộc server và có thông tin member, lấy thêm thông tin member
              if (latestPinnedMessage.guild && latestPinnedMessage.member) {
                (data.pinnedMessage as IDataObject).member = await enrichMember(
                  latestPinnedMessage.member
                );
              }
            } else {
              console.log(
                "🚀 ~ channelPinsUpdate - Không có tin nhắn ghim nào trong kênh."
              );
              data.pinnedMessage = null;
            }

            // Lưu toàn bộ danh sách tin nhắn ghim (nếu cần)
            data.pinnedMessages = pinnedMessages.map((message: Message) => ({
              ...message,
            }));
          } catch (error) {
            console.error("Lỗi khi fetch tin nhắn ghim:", error);
            data.pinnedMessage = null;
            data.pinnedMessages = [];
          }
          break;
        case Events.ChannelUpdate:
          const oldChannel: DMChannel | GuildChannel = args[0];
          const newChannel: DMChannel | GuildChannel = args[1];
          data.oldChannel = { ...oldChannel };
          data.newChannel = { ...newChannel };
          break;
        case Events.GuildAvailable:
          const guildAvailable: Guild = args[0]; // Đối tượng Guild

          // Trích xuất thông tin chi tiết từ guild
          data.guild = {
            ...guildAvailable,
            channels: guildAvailable.channels.cache.map((channel: any) => ({
              ...channel,
            })),
            roles: guildAvailable.roles.cache.map((role: Role) => ({
              ...role,
            })),
            // Nếu cần, fetch owner của guild
            owner: await guildAvailable
              .fetchOwner()
              .then((owner: GuildMember) => ({
                ...owner,
              }))
              .catch((error: any) => {
                console.error("Lỗi khi fetch owner:", error);
                return null;
              }),
          };
          break;

        case Events.GuildCreate:
          const guildCreated = args[0]; // Guild
          console.log(
            `🚀 ~ guildCreate - Bot được thêm vào guild ${guildCreated.name} (ID: ${guildCreated.id})`
          );

          data.guild = {
            ...guildCreated,
            channels: guildCreated.channels.cache.map(
              (channel: GuildChannel) => ({
                ...channel,
              })
            ),
            roles: guildCreated.roles.cache.map((role: Role) => ({
              ...role,
            })),
            owner: await guildCreated
              .fetchOwner()
              .then((owner: GuildMember) => ({
                ...owner,
              }))
              .catch((error: any) => {
                console.error("Lỗi khi fetch owner:", error);
                return null;
              }),
          };
          break;

        case Events.GuildDelete:
          const guildDeleted: Guild = args[0]; // Guild hoặc PartialGuild

          data.guild = {
            ...guildDeleted,
          };
          break;

        case Events.GuildUnavailable:
          const guildUnavailable: Guild = args[0]; // Guild

          data.guild = {
            ...guildUnavailable,
          };
          break;

        case Events.GuildUpdate:
          const oldGuild: Guild = args[0]; // Guild trước khi thay đổi
          const newGuild: Guild = args[1]; // Guild sau khi thay đổi

          data.oldGuild = {
            ...oldGuild,
          };
          data.newGuild = {
            ...newGuild,
          };
          // So sánh thay đổi (ví dụ: log những thay đổi chính)
          data.changes = {};
          if (oldGuild.name !== newGuild.name)
            (data.changes as IDataObject).name = {
              old: oldGuild.name,
              new: newGuild.name,
            };
          if (oldGuild.icon !== newGuild.icon)
            (data.changes as IDataObject).icon = {
              old: oldGuild.icon,
              new: newGuild.icon,
            };
          if (oldGuild.description !== newGuild.description)
            (data.changes as IDataObject).description = {
              old: oldGuild.description,
              new: newGuild.description,
            };
          break;

        case Events.GuildRoleCreate:
        case Events.GuildRoleDelete:
          const role: Role = args[0];
          data.role = { ...role };
          break;

        case Events.GuildRoleUpdate:
          const oldRole: Role = args[0];
          const newRole: Role = args[1];
          data.oldRole = { ...oldRole };
          data.newRole = { ...newRole };
          break;

        case Events.StageInstanceCreate:
        case Events.StageInstanceDelete:
          const stageInstance: StageInstance = args[0]; // StageInstance
          data.stageInstance = { ...stageInstance };
          break;

        case Events.StageInstanceUpdate:
          const oldStageInstance: StageInstance | null = args[0]; // StageInstance trước khi thay đổi
          const newStageInstance: StageInstance = args[1]; // StageInstance sau khi thay đổi

          data.oldStageInstance = oldStageInstance
            ? {
                ...oldStageInstance,
              }
            : null;

          data.newStageInstance = {
            ...newStageInstance,
          };
          // So sánh thay đổi
          data.changes = {};
          if (
            oldStageInstance &&
            oldStageInstance.topic !== newStageInstance.topic
          ) {
            (data.changes as IDataObject).topic = {
              old: oldStageInstance.topic,
              new: newStageInstance.topic,
            };
          }
          if (
            oldStageInstance &&
            oldStageInstance.privacyLevel !== newStageInstance.privacyLevel
          ) {
            (data.changes as IDataObject).privacyLevel = {
              old: oldStageInstance.privacyLevel,
              new: newStageInstance.privacyLevel,
            };
          }
          break;

        case Events.ThreadCreate:
          const threadCreate: ThreadChannel = args[0];
          const newlyCreated: boolean = args[1];
          data.thread = { ...threadCreate };
          data.newlyCreated = newlyCreated; // true nếu thread mới được tạo
          break;

        case Events.ThreadDelete:
          const deletedThread: ThreadChannel = args[0];
          data.thread = { ...deletedThread };
          break;
        case Events.ThreadListSync:
          const syncedThreads = args[0]; // Collection<Snowflake, ThreadChannel>
          const guildThreadListSync: Guild = args[1]; // Guild

          // Trích xuất danh sách thread được đồng bộ
          data.syncedThreads = syncedThreads.map((thread: ThreadChannel) => ({
            ...thread,
          }));
          data.guild = { ...guildThreadListSync };
          break;

        case Events.ThreadMembersUpdate:
          const addedMembers = args[0]; // Collection<Snowflake, ThreadMember>
          const removedMembers = args[1]; // Collection<Snowflake, ThreadMember>
          const threadMembersUpdate: ThreadChannel = args[2]; // ThreadChannel

          // Trích xuất thông tin thread
          data.thread = {
            ...threadMembersUpdate,
          };

          // Trích xuất danh sách thành viên được thêm
          data.addedMembers = addedMembers.map((member: GuildMember) => ({
            ...member,
          }));

          // Trích xuất danh sách thành viên bị xóa
          data.removedMembers = removedMembers.map((member: GuildMember) => ({
            ...member,
          }));

          break;
        case Events.ThreadMemberUpdate:
          const oldMember: ThreadMember = args[0]; // ThreadMember trước khi thay đổi
          const newMember: ThreadMember = args[1]; // ThreadMember sau khi thay đổi

          // Trích xuất thông tin thành viên trước và sau khi thay đổi
          data.oldMember = {
            ...oldMember,
          };
          data.newMember = {
            ...newMember,
          };

          break;
        case Events.ThreadUpdate:
          const oldThread: ThreadChannel = args[0];
          const newThread: ThreadChannel = args[1];
          data.oldThread = { ...oldThread };
          data.newThread = { ...newThread };
          break;

        // Moderation events
        case Events.GuildBanAdd:
        case Events.GuildBanRemove:
          const ban: GuildBan = args[0];
          data.ban = { ...ban };
          break;

        case Events.GuildAuditLogEntryCreate:
          const auditLogEntry: GuildAuditLogsEntry = args[0]; // GuildAuditLogsEntry
          const guildAuditLogEntry: Guild = args[1]; // Guild

          // Trích xuất thông tin từ audit log entry
          data.auditLogEntry = {
            ...auditLogEntry,
          };

          // Fetch thông tin chi tiết của người thực hiện hành động (executor)
          if (auditLogEntry.executorId) {
            try {
              const executor = await guildAuditLogEntry.client.users.fetch(
                auditLogEntry.executorId
              );
              data.executor = {
                ...executor,
              };
            } catch (error) {
              console.error("Lỗi khi fetch executor:", error);
              data.executor = null;
            }
          }
          data.guildAuditLogEntry = { ...guildAuditLogEntry };

          break;

        // Emoji & Sticker events
        case Events.GuildEmojiCreate:
        case Events.GuildEmojiDelete:
          const emoji: GuildEmoji = args[0]; // Emoji
          data.emoji = { ...emoji };
          break;

        case Events.GuildEmojiUpdate:
          const oldEmoji: GuildEmoji = args[0]; // Emoji trước khi thay đổi
          const newEmoji: GuildEmoji = args[1]; // Emoji sau khi thay đổi
          data.oldEmoji = { ...oldEmoji };
          data.newEmoji = { ...newEmoji };
          break;

        case Events.GuildStickerCreate:
        case Events.GuildStickerDelete:
          const sticker: Sticker = args[0]; // Sticker
          data.sticker = { ...sticker };
          break;

        case Events.GuildStickerUpdate:
          const oldSticker: Sticker = args[0]; // Sticker trước khi thay đổi
          const newSticker: Sticker = args[1]; // Sticker sau khi thay đổi
          data.oldSticker = { ...oldSticker };
          data.newSticker = { ...newSticker };
          break;

        // Integration & Webhook events
        case Events.GuildIntegrationsUpdate:
          const guildIntegrations: Guild = args[0]; // Guild
          data.guild = {
            ...guildIntegrations,
          };
          break;
        case Events.WebhooksUpdate:
          const webhooksChannel:
            | TextChannel
            | NewsChannel
            | VoiceChannel
            | StageChannel
            | ForumChannel
            | MediaChannel = args[0]; // Channel
          data.webhooksChannel = {
            ...webhooksChannel,
          };

          break;

        // Invite events
        case Events.InviteCreate:
        case Events.InviteDelete:
          const inviteCreated: Invite = args[0]; // Invite
          data.invite = { ...inviteCreated };
          break;

        // Voice events
        case Events.VoiceChannelEffectSend:
          const voiceChannelEffectSend: VoiceChannelEffect = args[0]; // VoiceChannelEffectSend
          data.voiceChannelEffectSend = { ...voiceChannelEffectSend };
          break;

        case Events.VoiceStateUpdate:
          const oldVoiceState: VoiceState = args[0]; // VoiceState trước khi thay đổi
          const newVoiceState: VoiceState = args[1]; // VoiceState sau khi thay đổi
          data.oldVoiceState = { ...oldVoiceState };
          data.newVoiceState = { ...newVoiceState };
          break;

        // Presence events
        case Events.PresenceUpdate:
          const oldPresence: Presence | null = args[0];
          const newPresence: Presence = args[1];
          data.oldPresence = oldPresence
            ? {
                ...oldPresence,
              }
            : null;
          data.newPresence = { ...newPresence };
          break;

        // Scheduled event events
        case Events.GuildScheduledEventCreate:
        case Events.GuildScheduledEventDelete:
          const guildScheduled: GuildScheduledEvent = args[0]; // GuildScheduledEvent
          data.guildScheduledEvent = { ...guildScheduled };
          data.guild = { ...guildScheduled.guild };
          break;
        case Events.GuildScheduledEventUpdate:
          const oldGuildScheduledEvent: GuildScheduledEvent | null = args[0]; // GuildScheduledEvent trước khi thay đổi
          const newGuildScheduledEvent: GuildScheduledEvent = args[1]; // GuildScheduledEvent sau khi thay đổi
          data.oldGuildScheduledEvent = oldGuildScheduledEvent
            ? { ...oldGuildScheduledEvent }
            : null;
          data.newGuildScheduledEvent = { ...newGuildScheduledEvent };
          break;
        case Events.GuildScheduledEventUserAdd:
        case Events.GuildScheduledEventUserRemove:
          const guildScheduledEvent: GuildScheduledEvent = args[0];
          const user: User = args[1];
          data.user = { ...user };
          data.guildScheduledEvent = { ...guildScheduledEvent };
          break;

        // Interaction events
        case Events.InteractionCreate:
          const interaction: BaseInteraction = args[0];
          data.interaction = { ...interaction };

          break;
        case Events.ApplicationCommandPermissionsUpdate:
          const dataApp: ApplicationCommandPermissionsUpdateData = args[0]; // ApplicationCommandPermissionsUpdateData
          data.dataApp = { ...dataApp };
          break;

        // Bot status events
        case Events.Debug:
          const info: string = args[0];
          data.info = info;
          break;
        case Events.Error:
          const error: Error = args[0];
          data.error = { ...error };
          break;
        case Events.Warn:
          const warn: string = args[0];
          data.warn = warn;
          break;
        case Events.ClientReady:
          const client: Client = args[0]; // Client
          data.client = { ...client };
          break;
        case Events.ShardDisconnect:
          const event: CloseEvent = args[0];
          const ShardDisconnectId: number = args[1];
          data.event = { ...event };
          data.id = ShardDisconnectId;
          break;
        case Events.ShardError:
          const shardError: Error = args[0];
          const shardId: number = args[1];
          data.errorShard = { ...shardError };
          data.shardId = shardId;
          break;

        case Events.ShardReady:
          const ShardReadyId: number = args[0];
          const unavailableGuilds: any | null = args[1];
          data.ShardReadyId = ShardReadyId;
          data.unavailableGuilds = { ...unavailableGuilds };
          break;

        case Events.ShardReconnecting:
          const ShardReconnectingId: number = args[0];
          data.id = ShardReconnectingId;
          break;

        case Events.ShardResume:
          const ShardResumeId: number = args[0];
          const replayedEvents: number = args[1];
          data.id = ShardResumeId;
          data.replayedEvent = replayedEvents;
          break;

        // User event
        case Events.UserUpdate:
          const oldUser: User = args[0]; // User trước khi thay đổi
          const newUser: User = args[1]; // User sau khi thay đổi
          data.oldUser = { ...oldUser };
          data.newUser = { ...newUser };
          break;

        // Member events
        case Events.GuildMemberAdd:
        case Events.GuildMemberAvailable:
        case Events.GuildMemberRemove:
          const member: GuildMember = args[0]; // GuildMember
          data.member = { ...member };
          break;

        case Events.GuildMemberUpdate:
          const oldMemberUpdate: GuildMember = args[0]; // GuildMember trước khi thay đổi
          const newMemberUpdate: GuildMember = args[1]; // GuildMember sau khi thay đổi
          data.oldMemberUpdate = { ...oldMemberUpdate };
          data.newMemberUpdate = { ...newMemberUpdate };
          break;

        case Events.GuildMembersChunk:
          const membersChunk: Collection<string, GuildMember> = args[0];
          const guild: Guild = args[1];
          const chunk: GuildMembersChunk = args[2]; // Số lượng thành viên trong chunk
          data.members = { ...membersChunk };
          data.guild = { ...guild };
          data.chunk = { ...chunk };
          break;

        // Auto moderation events
        case Events.AutoModerationActionExecution:
          const action: AutoModerationActionExecution = args[0];
          data.action = { ...action };

          break;
        case Events.AutoModerationRuleCreate:
        case Events.AutoModerationRuleDelete:
          const ruleCreated: AutoModerationRule = args[0];
          data.rule = { ...ruleCreated };
          break;

        case Events.AutoModerationRuleUpdate:
          const oldRule: AutoModerationRule | null = args[0]; // AutoModerationRule trước khi thay đổi
          const newRule: AutoModerationRule = args[1]; // AutoModerationRule sau khi thay đổi
          data.oldRule = { ...oldRule };
          data.newRule = { ...newRule };
          break;

        // Poll event
        case Events.MessagePollVoteAdd:
        case Events.MessagePollVoteRemove:
          const pollVoteAdd: PollAnswer = args[0]; // PollVote
          const userId: string = args[1]; // User ID
          data.pollVote = { ...pollVoteAdd };
          data.userId = userId;
          break;

        default:
          data.eventData = args;
          break;
      }

      this.triggerInstance.emit([
        this.triggerInstance.helpers.returnJsonArray([data]),
      ]);
    });
  }
}
