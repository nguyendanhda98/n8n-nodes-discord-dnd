import { Client, Events, Message, PartialMessage } from 'discord.js';
import { IDataObject, ITriggerFunctions } from 'n8n-workflow';
import { shouldTrigger } from './trigger-logic';
import { IMessageData, ITriggerOptions } from './types';
import { getChannelName } from './utils';

/**
 * Creates a message data object for emitting to n8n workflow
 * @param message Discord message that triggered the workflow
 * @param triggerType Type of trigger (messageContent or botInteraction)
 * @param matchPattern The pattern that was matched
 * @returns Formatted message data for n8n workflow
 */
export const createMessageData = (
  message: Message | PartialMessage,
  triggerType: string,
  matchPattern: string
): IMessageData => {
  return {
    messageId: message.id,
    content: message.content,
    authorId: message.author?.id,
    authorUsername: message.author?.username,
    channelId: message.channelId,
    channelName: getChannelName(message.channel),
    channelType: message.channel?.type,
    guildId: message.guildId,
    guildName: message.guild?.name,
    isBot: message.author?.bot || false,
    createdTimestamp: message.createdTimestamp,
    attachments: [...message.attachments.values()],
    embeds: message.embeds,
    mentions: {
      users: [...message.mentions.users.values()].map(user => ({
        id: user.id,
        username: user.username,
      })),
      roles: [...message.mentions.roles.values()].map(role => ({
        id: role.id,
        name: role.name,
      })),
      channels: [...message.mentions.channels.values()].map(channel => ({
        id: channel.id,
        name: getChannelName(channel),
      })),
    },
    // For replies, include the reference
    reference: message.reference ? {
      messageId: message.reference.messageId,
      channelId: message.reference.channelId,
      guildId: message.reference.guildId,
    } : null,
    triggerType: triggerType,
    matchPattern: matchPattern,
    rawData: message,
  };
};

/**
 * Sets up event handlers for the Discord client
 * @param client Discord client
 * @param triggerFunctions n8n trigger functions
 * @param options Trigger configuration options
 */
export const setupMessageEventHandler = (
  client: Client,
  triggerFunctions: ITriggerFunctions,
  options: ITriggerOptions
): void => {
  client.on(Events.MessageCreate, async (message) => {
    try {
      if (shouldTrigger(message, client, options)) {
        // Determine the match pattern to include in the data
        let matchPattern = '';
        if (options.triggerType === 'messageContent') {
          matchPattern = options.matchPattern || '';
        } else if (options.triggerType === 'botInteraction') {
          matchPattern = options.interactionType || '';
        }

        // Create message data and emit to n8n workflow
        const messageData = createMessageData(message, options.triggerType, matchPattern);
        
        // Convert messageData to a plain object that satisfies IDataObject
        const dataObject: IDataObject = {
          ...messageData,
          // Convert the rawData to prevent circular references
          rawData: undefined,
        };
        
        await triggerFunctions.emit([triggerFunctions.helpers.returnJsonArray([dataObject])]);
      }
    } catch (error) {
      console.error('Error handling Discord message:', error);
    }
  });
};