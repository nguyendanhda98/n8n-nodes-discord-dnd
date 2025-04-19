import { Client, Message, PartialMessage } from 'discord.js';
import { ICredentialDataDecryptedObject, ITriggerFunctions } from 'n8n-workflow';

export interface ITriggerParameters {
  triggerType: string;
  includeBotMessages: boolean;
  filterByServers: boolean;
  serverIds: string[];
  filterByChannels: boolean;
  channelIds: string[];
  filterByRoles: boolean;
  roleIds: string[];
  matchPattern?: string;
  matchValue?: string;
  regexPattern?: string;
  caseSensitive?: boolean;
  interactionType?: string;
}

export interface IDiscordClient {
  client: Client;
  login: (token: string) => Promise<string>;
  destroy: () => void;
}

export interface IFilterOptions {
  serverIds: string[];
  channelIds: string[];
  roleIds: string[];
  filterByServers: boolean;
  filterByChannels: boolean;
  filterByRoles: boolean;
}

export interface ITriggerOptions extends IFilterOptions {
  triggerType: string;
  matchPattern?: string;
  matchValue?: string;
  regexPattern?: string;
  caseSensitive?: boolean;
  interactionType?: string;
  includeBotMessages: boolean;
}

export interface IDiscordContext {
  client: Client;
  triggerFunctions: ITriggerFunctions;
  credentials: ICredentialDataDecryptedObject;
  parameters: ITriggerParameters;
}

export interface IMessageData {
  messageId: string;
  content: string | null;
  authorId?: string;
  authorUsername?: string;
  channelId: string;
  channelName: string | null;
  channelType: any;
  guildId: string | null;
  guildName?: string;
  isBot: boolean;
  createdTimestamp: number;
  attachments: any[];
  embeds: any[];
  mentions: {
    users: Array<{ id: string; username: string }>;
    roles: Array<{ id: string; name: string }>;
    channels: Array<{ id: string; name: string | null }>;
  };
  reference: {
    messageId?: string;
    channelId?: string;
    guildId?: string;
  } | null;
  triggerType: string;
  matchPattern: string;
  rawData: Message | PartialMessage;
}