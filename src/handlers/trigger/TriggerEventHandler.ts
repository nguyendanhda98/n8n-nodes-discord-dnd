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
  ChannelType,
} from "discord.js";
import { ITriggerFunctions, IDataObject } from "n8n-workflow";
import { messageToJson } from "../../transformers/MessageTransformer";
import { PatternType } from "../../Interfaces/types";

export class TriggerEventHandler {
  constructor(
    private readonly client: Client,
    private readonly triggerInstance: ITriggerFunctions
  ) {}

  async setupEventHandler(
    event: string,
    includeBot: boolean = false,
    directMessage: boolean = false,
    pattern: string = "botMention",
    value: string = "",
    serverIds: string[] = [],
    channelIds: string[] = [],
    roleIds: string[] = [],
    userIds: string[] = [],
    eventIds: string[] = []
  ) {
    // Store the original event name to avoid conflicts with Discord.js Event types
    const triggerEventName = event;
    
    // Map custom event names to actual Discord events
    const customEventMap: { [key: string]: string } = {
      guildScheduledEventStart: Events.GuildScheduledEventUpdate,
      guildScheduledEventEnd: Events.GuildScheduledEventUpdate,
    };

    // Get the actual Discord event to listen to
    const actualEvent = customEventMap[triggerEventName] || triggerEventName;

    // Handle main events
    this.client.on(actualEvent, async (...args: any[]) => {
      const data: IDataObject = {};

      // Handle custom scheduled event filters based on status changes
      if (triggerEventName === "guildScheduledEventStart" || 
          triggerEventName === "guildScheduledEventEnd") {
        const oldEvent: GuildScheduledEvent | null = args[0];
        const newEvent: GuildScheduledEvent = args[1];

        // Import GuildScheduledEventStatus for comparison
        const { GuildScheduledEventStatus } = await import("discord.js");

        // Check status changes and filter accordingly
        if (triggerEventName === "guildScheduledEventStart") {
          // Only trigger when status changes to ACTIVE
          if (newEvent.status !== GuildScheduledEventStatus.Active || 
              oldEvent?.status === GuildScheduledEventStatus.Active) {
            return;
          }
        } else if (triggerEventName === "guildScheduledEventEnd") {
          // Only trigger when status changes to COMPLETED
          if (newEvent.status !== GuildScheduledEventStatus.Completed || 
              oldEvent?.status === GuildScheduledEventStatus.Completed) {
            return;
          }
        }
        
        // Filter by event IDs if specified
        if (eventIds.length > 0 && !eventIds.includes(newEvent.id)) {
          return;
        }
      }
      
      // Filter scheduled events by event IDs (for non-status-change events)
      if (actualEvent === Events.GuildScheduledEventCreate ||
          actualEvent === Events.GuildScheduledEventDelete ||
          actualEvent === Events.GuildScheduledEventUpdate ||
          actualEvent === Events.GuildScheduledEventUserAdd ||
          actualEvent === Events.GuildScheduledEventUserRemove) {
        const scheduledEvent: GuildScheduledEvent = args[0];
        
        // Filter by event IDs if specified
        if (eventIds.length > 0 && !eventIds.includes(scheduledEvent.id)) {
          return;
        }
      }

      // Perform checks based on the event type
      if (triggerEventName === Events.MessageCreate) {
        const message: Message = args[0];

        // Skip if message is from a bot and includeBot is false
        if (!includeBot && message.author?.bot) {
          return;
        }

        // Skip if message is a DM and directMessage is false, or if it's not a DM and directMessage is true
        if (
          (!directMessage && message.channel.type === ChannelType.DM) ||
          (directMessage && message.channel.type !== ChannelType.DM)
        ) {
          return;
        }

        // Check server, channel and user ID filters
        if (
          serverIds.length > 0 &&
          (!message.guildId || !serverIds.includes(message.guildId))
        ) {
          return;
        }

        if (channelIds.length > 0 && !channelIds.includes(message.channelId)) {
          return;
        }

        if (userIds.length > 0 && !userIds.includes(message.author.id)) {
          return;
        }

        // Check role filter if not a DM
        if (roleIds.length > 0) {
          if (!message.guild || !message.member) {
            return;
          }

          const hasRole = message.member.roles.cache.some((role) =>
            roleIds.includes(role.id)
          );
          if (!hasRole) {
            return;
          }
        }

        // Apply pattern filtering for message triggers
        if (pattern) {
          let shouldTrigger = false;

          const content = message.content.toLowerCase();
          const filterValue = value.toLowerCase();

          switch (pattern) {
            case PatternType.BOT_MENTION:
              // Check if the bot is mentioned or if the message is a reply to the bot
              const isMentioned = message.mentions.users.has(
                this.client.user!.id
              );
              const isReplyToBot = message.reference?.messageId
                ? await message.channel.messages
                    .fetch(message.reference.messageId)
                    .then((msg) => msg.author.id === this.client.user!.id)
                    .catch(() => false)
                : false;

              shouldTrigger = isMentioned || isReplyToBot;
              break;

            case PatternType.CONTAINS:
              shouldTrigger = content.includes(filterValue);
              break;

            case PatternType.STARTS_WITH:
              shouldTrigger = content.startsWith(filterValue);
              break;

            case PatternType.ENDS_WITH:
              shouldTrigger = content.endsWith(filterValue);
              break;

            case PatternType.EQUALS:
              shouldTrigger = content === filterValue;
              break;

            case PatternType.REGEX:
              try {
                const regex = new RegExp(value, "i");
                shouldTrigger = regex.test(message.content);
              } catch (error) {
                console.error(`Invalid regex pattern: ${value}`, error);
              }
              break;

            case PatternType.EVERY:
              // Trigger on every message (no filtering)
              shouldTrigger = true;
              break;

            default:
              shouldTrigger = true;
              break;
          }

          // Skip if pattern doesn't match
          if (!shouldTrigger) {
            return;
          }
        }
      } else {
        // Apply general filters for non-message events
        const guildId = this.getGuildIdFromEvent(actualEvent, args);
        const channelId = this.getChannelIdFromEvent(actualEvent, args);
        const userId = this.getUserIdFromEvent(actualEvent, args);
        const member = this.getMemberFromEvent(actualEvent, args);

        // Filter by server ID if available
        if (
          serverIds.length > 0 &&
          (!guildId || !serverIds.includes(guildId))
        ) {
          return;
        }

        // Filter by channel ID if available
        if (
          channelIds.length > 0 &&
          (!channelId || !channelIds.includes(channelId))
        ) {
          return;
        }

        // Filter by user ID if available
        if (userIds.length > 0 && (!userId || !userIds.includes(userId))) {
          return;
        }

        // Filter by role ID if available
        if (roleIds.length > 0 && member) {
          const hasRole = member.roles?.cache.some((role) =>
            roleIds.includes(role.id)
          );
          if (!hasRole) {
            return;
          }
        }
      }

      switch (actualEvent) {
        // Message events
        case Events.MessageCreate:
          const message: Message = args[0];
          data.message = await messageToJson(message);
          break;

        case Events.MessageDelete:
          const deletedMessage: Message = args[0];
          data.message = { ...deletedMessage };
          break;

        case Events.MessageBulkDelete:
          const deletedMessages = args[0]; // Collection<Snowflake, Message>
          const channelMessageDeleteBulk: GuildTextBasedChannel = args[1]; // TextBasedChannel

          data.channel = {
            ...channelMessageDeleteBulk,
          };

          data.deletedMessages = deletedMessages.map((message: Message) => ({
            ...message,
          }));

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
          data.user = {
            ...reactUser,
          };
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

          data.reaction = {
            ...reactionMessageReactionRemoveEmoji,
          };

          break;

        case Events.TypingStart:
          const typing: Typing = args[0];
          data.typing = { ...typing };
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

          data.channel = {
            ...pinsChannel,
          };
          data.pinTimestamp = pinTimestamp.toISOString();

          try {
            const pinnedMessages = await pinsChannel.messages.fetchPinned();

            const latestPinnedMessage = pinnedMessages.last();

            if (latestPinnedMessage) {
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
                pinned: latestPinnedMessage.pinned,
                pinnedAt: pinTimestamp.toISOString(),
              };
            } else {
              console.log(
                "🚀 ~ channelPinsUpdate - Không có tin nhắn ghim nào trong kênh."
              );
              data.pinnedMessage = null;
            }

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
          const guildAvailable: Guild = args[0];

          data.guild = {
            ...guildAvailable,
            channels: guildAvailable.channels.cache.map((channel: any) => ({
              ...channel,
            })),
            roles: guildAvailable.roles.cache.map((role: Role) => ({
              ...role,
            })),
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
          const guildCreated = args[0];

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
          const guildDeleted: Guild = args[0];

          data.guild = {
            ...guildDeleted,
          };
          break;

        case Events.GuildUnavailable:
          const guildUnavailable: Guild = args[0];

          data.guild = {
            ...guildUnavailable,
          };
          break;

        case Events.GuildUpdate:
          const oldGuild: Guild = args[0];
          const newGuild: Guild = args[1];

          data.oldGuild = {
            ...oldGuild,
          };
          data.newGuild = {
            ...newGuild,
          };
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
          const stageInstance: StageInstance = args[0];

          data.stageInstance = { ...stageInstance };
          break;

        case Events.StageInstanceUpdate:
          const oldStageInstance: StageInstance | null = args[0];
          const newStageInstance: StageInstance = args[1];

          data.oldStageInstance = oldStageInstance
            ? {
                ...oldStageInstance,
              }
            : null;

          data.newStageInstance = {
            ...newStageInstance,
          };
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
          data.newlyCreated = newlyCreated;
          break;

        case Events.ThreadDelete:
          const deletedThread: ThreadChannel = args[0];

          data.thread = { ...deletedThread };
          break;

        case Events.ThreadListSync:
          const syncedThreads = args[0];
          const guildThreadListSync: Guild = args[1];

          data.syncedThreads = syncedThreads.map((thread: ThreadChannel) => ({
            ...thread,
          }));
          data.guild = { ...guildThreadListSync };
          break;

        case Events.ThreadMembersUpdate:
          const addedMembers = args[0];
          const removedMembers = args[1];
          const threadMembersUpdate: ThreadChannel = args[2];

          data.thread = {
            ...threadMembersUpdate,
          };

          data.addedMembers = addedMembers.map((member: GuildMember) => ({
            ...member,
          }));

          data.removedMembers = removedMembers.map((member: GuildMember) => ({
            ...member,
          }));

          break;

        case Events.ThreadMemberUpdate:
          const oldMember: ThreadMember = args[0];
          const newMember: ThreadMember = args[1];

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
          const auditLogEntry: GuildAuditLogsEntry = args[0];
          const guildAuditLogEntry: Guild = args[1];

          data.auditLogEntry = {
            ...auditLogEntry,
          };

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
          const emoji: GuildEmoji = args[0];

          data.emoji = { ...emoji };
          break;

        case Events.GuildEmojiUpdate:
          const oldEmoji: GuildEmoji = args[0];
          const newEmoji: GuildEmoji = args[1];

          data.oldEmoji = { ...oldEmoji };
          data.newEmoji = { ...newEmoji };
          break;

        case Events.GuildStickerCreate:
        case Events.GuildStickerDelete:
          const sticker: Sticker = args[0];

          data.sticker = { ...sticker };
          break;

        case Events.GuildStickerUpdate:
          const oldSticker: Sticker = args[0];
          const newSticker: Sticker = args[1];

          data.oldSticker = { ...oldSticker };
          data.newSticker = { ...newSticker };
          break;

        // Integration & Webhook events
        case Events.GuildIntegrationsUpdate:
          const guildIntegrations: Guild = args[0];

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
            | MediaChannel = args[0];

          data.webhooksChannel = {
            ...webhooksChannel,
          };

          break;

        // Invite events
        case Events.InviteCreate:
        case Events.InviteDelete:
          const inviteCreated: Invite = args[0];

          data.invite = { ...inviteCreated };
          break;

        // Voice events
        case Events.VoiceChannelEffectSend:
          const voiceChannelEffectSend: VoiceChannelEffect = args[0];

          data.voiceChannelEffectSend = { ...voiceChannelEffectSend };
          break;

        case Events.VoiceStateUpdate:
          const oldVoiceState: VoiceState = args[0];
          const newVoiceState: VoiceState = args[1];

          const userVoice = newVoiceState.member?.user;
          data.oldVoiceState = { ...oldVoiceState };
          data.newVoiceState = { ...newVoiceState };
          data.user = userVoice
            ? {
                ...userVoice,
                avatarURL: userVoice.displayAvatarURL({ size: 4096 }),
              }
            : null;
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
          const guildScheduled: GuildScheduledEvent = args[0];

          data.guildScheduledEvent = { ...guildScheduled };
          data.guild = {
            id: guildScheduled.guild?.id,
            name: guildScheduled.guild?.name,
            icon: guildScheduled.guild?.icon,
          };
          
          // Add event URL
          data.eventUrl = guildScheduled.url;
          
          // Fetch interested users
          try {
            const interestedUsers = await guildScheduled.fetchSubscribers();
            data.interestedCount = interestedUsers.size;
            data.interestedUsers = interestedUsers.map((eventUser) => ({
              id: eventUser.user.id,
              username: eventUser.user.username,
              discriminator: eventUser.user.discriminator,
              globalName: eventUser.user.globalName,
              displayName: eventUser.user.displayName,
              tag: eventUser.user.tag,
              serverName: guildScheduled.guild?.name,
            }));
          } catch (error) {
            console.error('Error fetching interested users:', error);
            data.interestedCount = 0;
            data.interestedUsers = [];
          }
          break;

        case Events.GuildScheduledEventUpdate:
          const oldGuildScheduledEvent: GuildScheduledEvent | null = args[0];
          const newGuildScheduledEvent: GuildScheduledEvent = args[1];

          data.oldGuildScheduledEvent = oldGuildScheduledEvent
            ? { ...oldGuildScheduledEvent }
            : null;
          data.newGuildScheduledEvent = { ...newGuildScheduledEvent };
          
          // Add event URL
          data.eventUrl = newGuildScheduledEvent.url;
          
          // Add status change information for custom events
          if (triggerEventName === "guildScheduledEventStart" || 
              triggerEventName === "guildScheduledEventEnd") {
            data.statusChange = {
              from: oldGuildScheduledEvent?.status,
              to: newGuildScheduledEvent.status,
              eventType: triggerEventName,
            };
            data.guildScheduledEvent = { ...newGuildScheduledEvent };
            data.guild = {
              id: newGuildScheduledEvent.guild?.id,
              name: newGuildScheduledEvent.guild?.name,
              icon: newGuildScheduledEvent.guild?.icon,
            };
          }
          
          // Fetch interested users for all update events
          try {
            const interestedUsers = await newGuildScheduledEvent.fetchSubscribers();
            data.interestedCount = interestedUsers.size;
            data.interestedUsers = interestedUsers.map((eventUser) => ({
              id: eventUser.user.id,
              username: eventUser.user.username,
              discriminator: eventUser.user.discriminator,
              globalName: eventUser.user.globalName,
              displayName: eventUser.user.displayName,
              tag: eventUser.user.tag,
              serverName: newGuildScheduledEvent.guild?.name,
            }));
          } catch (error) {
            console.error('Error fetching interested users:', error);
            data.interestedCount = 0;
            data.interestedUsers = [];
          }
          break;

        case Events.GuildScheduledEventUserAdd:
        case Events.GuildScheduledEventUserRemove:
          const guildScheduledEvent: GuildScheduledEvent = args[0];
          const user: User = args[1];

          data.user = { ...user };
          data.guildScheduledEvent = { ...guildScheduledEvent };
          
          // Add event URL
          data.eventUrl = guildScheduledEvent.url;
          
          // Fetch interested users
          try {
            const interestedUsers = await guildScheduledEvent.fetchSubscribers();
            data.interestedCount = interestedUsers.size;
            data.interestedUsers = interestedUsers.map((eventUser) => ({
              id: eventUser.user.id,
              username: eventUser.user.username,
              discriminator: eventUser.user.discriminator,
              globalName: eventUser.user.globalName,
              displayName: eventUser.user.displayName,
              tag: eventUser.user.tag,
              serverName: guildScheduledEvent.guild?.name,
            }));
          } catch (error) {
            console.error('Error fetching interested users:', error);
            data.interestedCount = 0;
            data.interestedUsers = [];
          }
          break;

        // Interaction events
        case Events.InteractionCreate:
          const interaction: BaseInteraction = args[0];

          data.interaction = { ...interaction, token: interaction.token };

          break;

        case Events.ApplicationCommandPermissionsUpdate:
          const dataApp: ApplicationCommandPermissionsUpdateData = args[0];

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
          const client: Client = args[0];
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
          const oldUser: User = args[0];
          const newUser: User = args[1];
          data.oldUser = { ...oldUser };
          data.newUser = { ...newUser };
          break;

        // Member events
        case Events.GuildMemberAdd:
        case Events.GuildMemberAvailable:
        case Events.GuildMemberRemove:
          const member: GuildMember = args[0];

          data.member = { ...member };
          break;

        case Events.GuildMemberUpdate:
          const oldMemberUpdate: GuildMember = args[0];
          const newMemberUpdate: GuildMember = args[1];

          data.oldMemberUpdate = { ...oldMemberUpdate };
          data.newMemberUpdate = { ...newMemberUpdate };
          break;

        case Events.GuildMembersChunk:
          const membersChunk: Collection<string, GuildMember> = args[0];
          const guild: Guild = args[1];
          const chunk: GuildMembersChunk = args[2];

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
          const oldRule: AutoModerationRule | null = args[0];
          const newRule: AutoModerationRule = args[1];

          data.oldRule = { ...oldRule };
          data.newRule = { ...newRule };
          break;

        // Poll event
        case Events.MessagePollVoteAdd:
        case Events.MessagePollVoteRemove:
          const pollVoteAdd: PollAnswer = args[0];
          const userId: string = args[1];

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

  // Helper method to extract guild ID from different event types
  private getGuildIdFromEvent(event: string, args: any[]): string | undefined {
    switch (event) {
      case Events.MessageDelete:
      case Events.MessageUpdate:
        return args[0]?.guildId;

      case Events.MessageReactionAdd:
      case Events.MessageReactionRemove:
        return args[0]?.message.guildId;

      case Events.ChannelCreate:
      case Events.ChannelDelete:
      case Events.ChannelUpdate:
        return args[0]?.guildId;

      case Events.GuildAvailable:
      case Events.GuildCreate:
      case Events.GuildDelete:
      case Events.GuildUnavailable:
        return args[0]?.id;

      case Events.GuildMemberAdd:
      case Events.GuildMemberAvailable:
      case Events.GuildMemberRemove:
        return args[0]?.guild?.id;

      case Events.GuildRoleCreate:
      case Events.GuildRoleDelete:
      case Events.GuildRoleUpdate:
        return args[0]?.guild?.id;

      case Events.GuildScheduledEventCreate:
      case Events.GuildScheduledEventDelete:
        return args[0]?.guildId;

      case Events.GuildScheduledEventUpdate:
        return args[1]?.guildId; // args[1] is the new event

      case Events.GuildScheduledEventUserAdd:
      case Events.GuildScheduledEventUserRemove:
        return args[0]?.guildId;

      default:
        return undefined;
    }
  }

  // Helper method to extract channel ID from different event types
  private getChannelIdFromEvent(
    event: string,
    args: any[]
  ): string | undefined {
    switch (event) {
      case Events.MessageDelete:
      case Events.MessageUpdate:
        return args[0]?.channelId;

      case Events.MessageReactionAdd:
      case Events.MessageReactionRemove:
        return args[0]?.message.channelId;

      case Events.ChannelCreate:
      case Events.ChannelDelete:
      case Events.ChannelUpdate:
        return args[0]?.id;

      default:
        return undefined;
    }
  }

  // Helper method to extract user ID from different event types
  private getUserIdFromEvent(event: string, args: any[]): string | undefined {
    switch (event) {
      case Events.MessageDelete:
      case Events.MessageUpdate:
        return args[0]?.author?.id;

      case Events.MessageReactionAdd:
      case Events.MessageReactionRemove:
        return args[1]?.id;

      case Events.GuildMemberAdd:
      case Events.GuildMemberAvailable:
      case Events.GuildMemberRemove:
      case Events.GuildMemberUpdate:
        return args[0]?.id;

      default:
        return undefined;
    }
  }

  // Helper method to extract member from different event types
  private getMemberFromEvent(
    event: string,
    args: any[]
  ): GuildMember | undefined {
    switch (event) {
      case Events.GuildMemberAdd:
      case Events.GuildMemberAvailable:
      case Events.GuildMemberRemove:
      case Events.GuildMemberUpdate:
        return args[0];

      default:
        return undefined;
    }
  }
}
