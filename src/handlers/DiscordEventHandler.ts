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
  Interaction,
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
} from "discord.js";
import { ITriggerFunctions, IDataObject } from "n8n-workflow";
import { messageToJson } from "../transformers/MessageTransformer";

export class DiscordEventHandler {
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
            member?.roles.cache.map((role) => ({
              id: role.id,
              name: role.name,
            })) || [],
        };
      };

      switch (event) {
        // Message events
        case "messageCreate":
          const message: Message = args[0];
          data.message = await messageToJson(message);

          // Use the guild ID from the message when enriching the author
          if (message.author && message.guildId) {
            data.user = await enrichMember(message.author, message.guildId);
          } else {
            data.user = message.author;
          }
          break;

        case "messageDelete":
          const deletedMessage: Message = args[0];
          data.message = { ...deletedMessage };
          break;
        case "messageDeleteBulk":
          const deletedMessages = args[0]; // Collection<Snowflake, Message>
          const channelMessageDeleteBulk: GuildTextBasedChannel = args[1]; // TextBasedChannel

          // Trích xuất thông tin kênh
          data.channel = {
            id: channelMessageDeleteBulk.id,
            name: channelMessageDeleteBulk.name || "DM", // DM channels không có name
            guildId: channelMessageDeleteBulk.guildId || null,
            type: channelMessageDeleteBulk.type,
          };

          // Trích xuất danh sách tin nhắn bị xóa
          data.deletedMessages = deletedMessages.map((message: Message) => ({
            id: message.id,
            content: message.content || "", // Nội dung tin nhắn (nếu có)
            authorId: message.author?.id,
            createdTimestamp: message.createdTimestamp,
          }));

          // Tổng số tin nhắn bị xóa
          data.deletedCount = deletedMessages.size;

          break;

        case "messageUpdate":
          const oldMessage: Message = args[0];
          const newMessage: Message = args[1];
          data.oldMessage = { ...oldMessage };
          data.newMessage = { ...newMessage };
          break;

        case "messageReactionAdd":
        case "messageReactionRemove":
          const reaction: MessageReaction = args[0];
          const reactUser: User = args[1];
          data.reaction = { ...reaction };
          data.user = await enrichMember(
            reactUser,
            reaction.message.guildId || undefined
          );
          break;

        case "messageReactionRemoveAll":
          const messageReactionRemoved: Message = args[0];
          data.message = { ...messageReactionRemoved };
          break;

        case "messageReactionRemoveEmoji":
          const reactionMessageReactionRemoveEmoji: MessageReaction = args[0]; // MessageReaction
          console.log(
            `🚀 ~ messageReactionRemoveEmoji - Emoji ${reactionMessageReactionRemoveEmoji.emoji.name} removed from message ${reactionMessageReactionRemoveEmoji.message.id}`
          );

          // Trích xuất thông tin tin nhắn và reaction
          data.reaction = {
            emoji: {
              id: reactionMessageReactionRemoveEmoji.emoji.id, // ID của emoji (null nếu là emoji Unicode)
              name: reactionMessageReactionRemoveEmoji.emoji.name, // Tên emoji (ví dụ: "👍" hoặc "custom_emoji")
              animated:
                reactionMessageReactionRemoveEmoji.emoji.animated || false,
            },
            message: {
              id: reactionMessageReactionRemoveEmoji.message.id,
              channelId: reactionMessageReactionRemoveEmoji.message.channelId,
              guildId:
                reactionMessageReactionRemoveEmoji.message.guildId || null,
              content: reactionMessageReactionRemoveEmoji.message.content || "",
              authorId: reactionMessageReactionRemoveEmoji.message.author?.id,
            },
          };

          break;

        case "typingStart":
          const typing: any = args[0];
          data.typing = { ...typing };
          if (typing.user) {
            data.user = await enrichMember(typing.user, typing.guildId);
          }
          break;

        // Guild events
        case "channelCreate":
          const channel: GuildChannel = args[0];
          data.channel = { ...channel };
          break;

        case "channelDelete":
          const deletedChannel: GuildChannel = args[0];
          data.channel = { ...deletedChannel };
          break;
        case "channelPinsUpdate":
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
            data.pinnedMessages = pinnedMessages.map((message: any) => ({
              id: message.id,
              content: message.content,
              authorId: message.author?.id,
              createdTimestamp: message.createdTimestamp,
            }));
          } catch (error) {
            console.error("Lỗi khi fetch tin nhắn ghim:", error);
            data.pinnedMessage = null;
            data.pinnedMessages = [];
          }
          break;
        case "channelUpdate":
          const oldChannel: GuildChannel = args[0];
          const newChannel: GuildChannel = args[1];
          data.oldChannel = { ...oldChannel };
          data.newChannel = { ...newChannel };
          break;
        case "guildAvailable":
          const guildAvailable: Guild = args[0]; // Đối tượng Guild

          // Trích xuất thông tin chi tiết từ guild
          data.guild = {
            id: guildAvailable.id,
            name: guildAvailable.name,
            icon: guildAvailable.icon,
            description: guildAvailable.description,
            memberCount: guildAvailable.memberCount,
            ownerId: guildAvailable.ownerId,
            joinedTimestamp: guildAvailable.joinedTimestamp,
            available: guildAvailable.available, // Phải là true trong sự kiện guildAvailable
            channels: guildAvailable.channels.cache.map((channel: any) => ({
              id: channel.id,
              name: channel.name,
              type: channel.type,
            })),
            roles: guildAvailable.roles.cache.map((role: Role) => ({
              id: role.id,
              name: role.name,
              color: role.color,
              permissions: role.permissions?.bitfield,
            })),
            // Nếu cần, fetch owner của guild
            owner: await guildAvailable
              .fetchOwner()
              .then((owner: GuildMember) => ({
                id: owner.id,
                username: owner.user?.username,
                globalName: owner.user?.globalName,
                nickname: owner.nickname,
              }))
              .catch((error: any) => {
                console.error("Lỗi khi fetch owner:", error);
                return null;
              }),
          };
          break;

        case "guildCreate":
          const guildCreated = args[0]; // Guild
          console.log(
            `🚀 ~ guildCreate - Bot được thêm vào guild ${guildCreated.name} (ID: ${guildCreated.id})`
          );

          data.guild = {
            id: guildCreated.id,
            name: guildCreated.name,
            icon: guildCreated.icon,
            description: guildCreated.description,
            memberCount: guildCreated.memberCount,
            ownerId: guildCreated.ownerId,
            joinedTimestamp: guildCreated.joinedTimestamp,
            available: guildCreated.available,
            channels: guildCreated.channels.cache.map(
              (channel: GuildChannel) => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
              })
            ),
            roles: guildCreated.roles.cache.map((role: Role) => ({
              id: role.id,
              name: role.name,
              color: role.color,
              permissions: role.permissions?.bitfield,
            })),
            owner: await guildCreated
              .fetchOwner()
              .then((owner: GuildMember) => ({
                id: owner.id,
                username: owner.user?.username,
                globalName: owner.user?.globalName,
                nickname: owner.nickname,
              }))
              .catch((error: any) => {
                console.error("Lỗi khi fetch owner:", error);
                return null;
              }),
          };
          break;

        case "guildDelete":
          const guildDeleted = args[0]; // Guild hoặc PartialGuild
          console.log(
            `🚀 ~ guildDelete - Bot bị xóa khỏi guild ${
              guildDeleted.name || "unknown"
            } (ID: ${guildDeleted.id})`
          );

          data.guild = {
            id: guildDeleted.id,
            name: guildDeleted.name || "unknown", // PartialGuild có thể không có name
            available: guildDeleted.available || false, // Có thể là false nếu guild không khả dụng
          };
          break;

        case "guildUnavailable":
          const guildUnavailable = args[0]; // Guild
          console.log(
            `🚀 ~ guildUnavailable - Guild ${guildUnavailable.name} (ID: ${guildUnavailable.id}) không khả dụng.`
          );

          data.guild = {
            id: guildUnavailable.id,
            name: guildUnavailable.name,
            available: guildUnavailable.available, // Sẽ là false
          };
          break;

        case "guildUpdate":
          const oldGuild = args[0]; // Guild trước khi thay đổi
          const newGuild = args[1]; // Guild sau khi thay đổi
          console.log(
            `🚀 ~ guildUpdate - Guild ${oldGuild.name} (ID: ${oldGuild.id}) đã được cập nhật.`
          );

          data.oldGuild = {
            id: oldGuild.id,
            name: oldGuild.name,
            icon: oldGuild.icon,
            description: oldGuild.description,
            memberCount: oldGuild.memberCount,
            ownerId: oldGuild.ownerId,
          };
          data.newGuild = {
            id: newGuild.id,
            name: newGuild.name,
            icon: newGuild.icon,
            description: newGuild.description,
            memberCount: newGuild.memberCount,
            ownerId: newGuild.ownerId,
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

        case "roleCreate":
        case "roleDelete":
          const role: Role = args[0];
          data.role = { ...role };
          data.guild = { ...role.guild };
          break;

        case "roleUpdate":
          const oldRole: Role = args[0];
          const newRole: Role = args[1];
          data.oldRole = { ...oldRole };
          data.newRole = { ...newRole };
          data.guild = { ...newRole.guild };
          break;

        case "stageInstanceCreate":
          const stageInstanceCreated: StageInstance = args[0]; // StageInstance
          data.stageInstance = { ...stageInstanceCreated };
          break;

        case "stageInstanceDelete":
          const stageInstanceDeleted: StageInstance = args[0]; // StageInstance

          data.stageInstance = {
            id: stageInstanceDeleted.id,
            channelId: stageInstanceDeleted.channelId,
            guildId: stageInstanceDeleted.guildId,
            topic: stageInstanceDeleted.topic,
            privacyLevel: stageInstanceDeleted.privacyLevel,
          };
          break;

        case "stageInstanceUpdate":
          const oldStageInstance: StageInstance | null = args[0]; // StageInstance trước khi thay đổi
          const newStageInstance: StageInstance = args[1]; // StageInstance sau khi thay đổi

          data.oldStageInstance = oldStageInstance
            ? {
                id: oldStageInstance.id,
                channelId: oldStageInstance.channelId,
                guildId: oldStageInstance.guildId,
                topic: oldStageInstance.topic,
                privacyLevel: oldStageInstance.privacyLevel,
              }
            : null;

          data.newStageInstance = {
            id: newStageInstance.id,
            channelId: newStageInstance.channelId,
            guildId: newStageInstance.guildId,
            topic: newStageInstance.topic,
            privacyLevel: newStageInstance.privacyLevel,
            discoverableDisabled: newStageInstance.discoverableDisabled,
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

        case "threadCreate":
          const threadCreate: ThreadChannel = args[0];
          data.thread = { ...threadCreate };
          break;

        case "threadDelete":
          const deletedThread: ThreadChannel = args[0];
          data.thread = { ...deletedThread };
          break;
        case "threadListSync":
          const syncedThreads = args[0]; // Collection<Snowflake, ThreadChannel>
          const channels = args[1]; // Collection<Snowflake, GuildChannel>
          const guildThreadListSync = args[2]; // Guild
          console.log(
            `🚀 ~ threadListSync - Synced ${syncedThreads.size} threads in guild ${guildThreadListSync.name} (ID: ${guildThreadListSync.id})`
          );

          // Trích xuất thông tin guild
          data.guild = {
            id: guildThreadListSync.id,
            name: guildThreadListSync.name,
          };

          // Trích xuất danh sách kênh
          data.channels = channels.map((channel: GuildChannel) => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
          }));

          // Trích xuất danh sách thread được đồng bộ
          data.syncedThreads = syncedThreads.map((thread: ThreadChannel) => ({
            id: thread.id,
            name: thread.name,
            channelId: thread.parentId,
            guildId: thread.guildId,
            memberCount: thread.memberCount,
            createdTimestamp: thread.createdTimestamp,
          }));

        case "threadMembersUpdate":
          const addedMembers = args[0]; // Collection<Snowflake, ThreadMember>
          const removedMembers = args[1]; // Collection<Snowflake, ThreadMember>
          const threadMembersUpdate: ThreadChannel = args[2]; // ThreadChannel
          console.log(
            `🚀 ~ threadMembersUpdate - Thread ${threadMembersUpdate.name} (ID: ${threadMembersUpdate.id}) updated members.`
          );

          // Trích xuất thông tin thread
          data.thread = {
            id: threadMembersUpdate.id,
            name: threadMembersUpdate.name,
            channelId: threadMembersUpdate.parentId, // ID của kênh cha
            guildId: threadMembersUpdate.guildId,
            memberCount: threadMembersUpdate.memberCount,
          };

          // Trích xuất danh sách thành viên được thêm
          data.addedMembers = addedMembers.map((member: GuildMember) => ({
            id: member.id,
            userId: member.user,
          }));

          // Trích xuất danh sách thành viên bị xóa
          data.removedMembers = removedMembers.map((member: GuildMember) => ({
            id: member.id,
            user: member.user,
          }));

          // Nếu cần, fetch thông tin chi tiết của thành viên (yêu cầu GUILD_MEMBERS intent)
          if (
            threadMembersUpdate.guild &&
            (addedMembers.size > 0 || removedMembers.size > 0)
          ) {
            data.addedMembersDetails = await Promise.all(
              addedMembers.map(async (member: GuildMember) => ({
                id: member.id,
                user: await thread.guild.members
                  .fetch(member.user)
                  .then((m: GuildMember) => ({
                    id: m.id,
                    username: m.user?.username,
                    globalName: m.user?.globalName,
                    nickname: m.nickname,
                  }))
                  .catch(() => null),
              }))
            );
            data.removedMembersDetails = await Promise.all(
              removedMembers.map(async (member: GuildMember) => ({
                id: member.id,
                user: await thread.guild.members
                  .fetch(member.user)
                  .then((m: GuildMember) => ({
                    id: m.id,
                    username: m.user?.username,
                    globalName: m.user?.globalName,
                    nickname: m.nickname,
                  }))
                  .catch(() => null),
              }))
            );
          }
          break;
        case "threadMemberUpdate":
          const oldMember = args[0]; // ThreadMember trước khi thay đổi
          const newMember = args[1]; // ThreadMember sau khi thay đổi
          console.log(
            `🚀 ~ threadMemberUpdate - Thread member updated in thread ${newMember.thread.id}`
          );

          // Trích xuất thông tin thread
          const thread = newMember.thread;
          data.thread = {
            id: thread.id,
            name: thread.name,
            channelId: thread.parentId, // ID của kênh cha
            guildId: thread.guildId,
            memberCount: thread.memberCount,
          };

          // Trích xuất thông tin thành viên trước và sau khi thay đổi
          data.oldMember = {
            id: oldMember.id,
            userId: oldMember.userId,
            threadId: oldMember.threadId,
          };
          data.newMember = {
            id: newMember.id,
            userId: newMember.userId,
            threadId: newMember.threadId,
          };

          // So sánh thay đổi (nếu có)
          data.changes = {};
          // Hiện tại ThreadMember không có nhiều thuộc tính có thể thay đổi, nhưng bạn có thể thêm logic so sánh nếu Discord cập nhật thêm tính năng
          // Ví dụ: if (oldMember.someProperty !== newMember.someProperty) { ... }

          // Fetch thông tin chi tiết của thành viên (nếu cần)
          if (thread.guild) {
            data.memberDetails = await thread.guild.members
              .fetch(newMember.userId)
              .then((member: GuildMember) => ({
                id: member.id,
                username: member.user?.username,
                globalName: member.user?.globalName,
                nickname: member.nickname,
                roles: member.roles.cache.map((role) => ({
                  id: role.id,
                  name: role.name,
                })),
              }))
              .catch((error: any) => {
                console.error("Lỗi khi fetch member:", error);
                return null;
              });
          }
          break;
        case "threadUpdate":
          const oldThread: ThreadChannel = args[0];
          const newThread: ThreadChannel = args[1];
          data.oldThread = { ...oldThread };
          data.newThread = { ...newThread };
          break;

        // Moderation events
        case "guildBanAdd":
        case "guildBanRemove":
          const ban: GuildBan = args[0];
          data.ban = { ...ban };
          data.guild = { ...ban.guild };
          data.user = await enrichMember(ban.user, ban.guild.id);
          break;

        case "guildAuditLogEntryCreate":
          const auditLogEntry: GuildAuditLogsEntry = args[0]; // GuildAuditLogsEntry
          const guildAuditLogEntry: Guild = args[1]; // Guild

          // Trích xuất thông tin từ audit log entry
          data.auditLogEntry = {
            id: auditLogEntry.id,
            guildId: guildAuditLogEntry.id,
            action: auditLogEntry.action, // Loại hành động (MESSAGE_DELETE, MEMBER_KICK, v.v.)
            executorId: auditLogEntry.executorId, // ID của người thực hiện hành động
            targetId: auditLogEntry.targetId, // ID của mục tiêu (thành viên, tin nhắn, kênh, v.v.)
            reason: auditLogEntry.reason || null, // Lý do (nếu có)
            createdTimestamp: auditLogEntry.createdTimestamp,
          };

          // Fetch thông tin chi tiết của người thực hiện hành động (executor)
          if (auditLogEntry.executorId) {
            try {
              const executor = await guildAuditLogEntry.client.users.fetch(
                auditLogEntry.executorId
              );
              data.executor = {
                id: executor.id,
                username: executor.username,
                globalName: executor.globalName,
                tag: executor.tag,
              };
            } catch (error) {
              console.error("Lỗi khi fetch executor:", error);
              data.executor = null;
            }
          }

          break;

        // Emoji & Sticker events
        case "emojiCreate":
          const emojiCreated: Emoji = args[0]; // Emoji
          data.emoji = { ...emojiCreated };
        case "emojiDelete":
          const emojiDeleted: Emoji = args[0]; // Emoji
          data.emoji = { ...emojiDeleted };
          break;

        case "emojiUpdate":
          const oldEmoji: Emoji = args[0]; // Emoji trước khi thay đổi
          const newEmoji: Emoji = args[1]; // Emoji sau khi thay đổi
          data.oldEmoji = { ...oldEmoji };
          data.newEmoji = { ...newEmoji };
          break;

        case "stickerCreate":
          const stickerCreated: Sticker = args[0]; // Sticker
          data.sticker = { ...stickerCreated };
          break;
        case "stickerDelete":
          const stickerDeleted: Sticker = args[0]; // Sticker
          data.sticker = { ...stickerDeleted };
          break;
        case "stickerUpdate":
          const oldSticker: Sticker = args[0]; // Sticker trước khi thay đổi
          const newSticker: Sticker = args[1]; // Sticker sau khi thay đổi
          data.oldSticker = { ...oldSticker };
          data.newSticker = { ...newSticker };
          break;

        // Integration & Webhook events
        case "guildIntegrationsUpdate":
          const guildIntegrations: Guild = args[0]; // Guild
          data.guild = {
            id: guildIntegrations.id,
            name: guildIntegrations.name,
          };
          break;
        case "webhooksUpdate":
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
          data.guild = {
            id: webhooksChannel.guildId,
            name: webhooksChannel.guild.name,
          };
          break;

        // Invite events
        case "inviteCreate":
          const inviteCreated: Invite = args[0]; // Invite
          data.invite = { ...inviteCreated };
          data.guild = { ...inviteCreated.guild };
          break;

        case "inviteDelete":
          const inviteDeleted: Invite = args[0]; // Invite
          data.invite = { ...inviteDeleted };
          data.guild = { ...inviteDeleted.guild };
          break;

        // Voice events
        case "voiceChannelEffectSend":
          const voiceChannelEffectSend: VoiceChannelEffect = args[0]; // VoiceChannelEffectSend
          data.voiceChannelEffectSend = { ...voiceChannelEffectSend };
          break;

        case "voiceStateUpdate":
          const oldVoiceState: VoiceState = args[0]; // VoiceState trước khi thay đổi
          const newVoiceState: VoiceState = args[1]; // VoiceState sau khi thay đổi
          data.oldVoiceState = { ...oldVoiceState };
          data.newVoiceState = { ...newVoiceState };
          break;

        // Presence events
        case "presenceUpdate":
          const oldPresence: Presence | null = args[0];
          const newPresence: Presence = args[1];
          if (oldPresence) data.oldPresence = { ...oldPresence };
          data.newPresence = { ...newPresence };
          break;

        // Scheduled event events
        case "guildScheduledEventCreate":
        case "guildScheduledEventDelete":
        case "guildScheduledEventUpdate":
          const scheduledEvent: GuildScheduledEvent = args[0];
          data.scheduledEvent = { ...scheduledEvent };
          data.guild = { ...scheduledEvent.guild };
          break;
        case "guildScheduledEventUserAdd":
        case "guildScheduledEventUserRemove":
          const guildScheduledEvent: GuildScheduledEvent = args[0];
          const user: User = args[1];
          data.user = { ...user };
          data.guildScheduledEvent = { ...guildScheduledEvent };
          data.guild = { ...guildScheduledEvent.guild };
          break;

        // Interaction events
        case "interactionCreate":
          const interaction: Interaction = args[0];
          data.interaction = { ...interaction };

          if (interaction.guild) {
            data.guild = {
              id: interaction.guild.id,
              name: interaction.guild.name,
            };
          }

          if (interaction.user) {
            data.user = await enrichMember(
              interaction.user,
              interaction.guildId || undefined
            );
          }
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
          data.unavailableGuilds = unavailableGuilds;
          break;

        case Events.ShardReconnecting:
          const ShardReconnectingId: number = args[0];
          data.ShardReconnectingId = ShardReconnectingId;
          break;

        case Events.ShardResume:
          const ShardResumeId: number = args[0];
          const replayedEvents: number = args[1];
          data.ShardResumeId = ShardResumeId;
          data.replayedEvents = replayedEvents;
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
          const memberAdded: GuildMember = args[0]; // GuildMember
          data.member = { ...memberAdded };
          break;
        case Events.GuildMemberAvailable:
          const memberAvailable: GuildMember = args[0]; // GuildMember
          data.member = { ...memberAvailable };
          break;
        case Events.GuildMemberRemove:
          const memberRemoved: GuildMember = args[0]; // GuildMember
          data.member = { ...memberRemoved };
          break;
        case Events.GuildMemberUpdate:
          const memberUpdate: GuildMember = args[0];
          data.member = { ...memberUpdate };
          data.guild = { ...memberUpdate.guild };
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

          if (action.guild) {
            data.guild = { ...action.guild };
          }
          break;
        case Events.AutoModerationRuleCreate:
          const ruleCreated: AutoModerationRule = args[0];
          data.rule = { ...ruleCreated };
          break;
        case Events.AutoModerationRuleDelete:
          const ruleDeleted: AutoModerationRule = args[0];
          data.rule = { ...ruleDeleted };
          break;

        case "autoModerationRuleUpdate":
          const oldRule: AutoModerationRule | null = args[0]; // AutoModerationRule trước khi thay đổi
          const newRule: AutoModerationRule = args[1]; // AutoModerationRule sau khi thay đổi
          data.oldRule = { ...oldRule };
          data.newRule = { ...newRule };
          break;

        // Poll event
        case Events.MessagePollVoteAdd:
          const pollVoteAdd: PollAnswer = args[0]; // PollVote
          const userId: string = args[1]; // User ID
          data.pollVote = { ...pollVoteAdd };
          data.userId = userId;
          break;

        case Events.MessagePollVoteRemove:
          const pollVoteRemove: PollAnswer = args[0]; // PollVote
          const userIdRemove: string = args[1]; // User ID
          data.pollVote = { ...pollVoteRemove };
          data.userId = userIdRemove;
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
