export interface ITriggerParameters {
  triggerType: string;
  event: string;
  includeBot?: boolean;
  directMessage?: boolean;
  pattern?: string;
  value?: string;
  caseSensitive?: boolean;
  serverIds?: string[];
  channelIds?: string[];
  roleIds?: string[];
  userIds?: string[];
}

export interface IActionParameters {
  actionType: string;
  action: string;
}

export enum PatternType {
  BOT_MENTION = "botMention",
  CONTAINS = "contains",
  STARTS_WITH = "startsWith",
  ENDS_WITH = "endsWith",
  EQUALS = "equals",
  REGEX = "regex",
  EVERY = "every",
}

export enum TriggerType {
  MESSAGE = "message",
  GUILD = "guild",
  MODERATION = "moderation",
  EMOJI_STICKER = "emojiSticker",
  INTEGRATION_WEBHOOK = "integrationWebhook",
  INVITE = "invite",
  VOICE = "voice",
  PRESENCE = "presence",
  SCHEDULED_EVENT = "scheduledEvent",
  INTERACTION = "interaction",
  BOT_STATUS = "botStatus",
  USER = "user",
  AUTO_MODERATION = "autoModeration",
  POLL = "poll",
}
