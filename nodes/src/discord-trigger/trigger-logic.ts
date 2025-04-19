import { Message, PartialMessage } from 'discord.js';
import { isChannelAllowed, isRoleAllowed, isServerAllowed } from './filters';
import { ITriggerOptions } from './types';

/**
 * Determines if a message should trigger the workflow based on provided options
 * @param message Discord message
 * @param client Discord client
 * @param options Configuration options for triggering
 * @returns Boolean indicating if the workflow should be triggered
 */
export const shouldTrigger = (
  message: Message | PartialMessage, 
  client: any, 
  options: ITriggerOptions
): boolean => {
  // Ignore messages from bots if not explicitly included
  if (message.author?.bot && !options.includeBotMessages) {
    return false;
  }

  // Check if message passes server, channel, and role filters
  if (
    !isServerAllowed(message, options) || 
    !isChannelAllowed(message, options) || 
    !isRoleAllowed(message, options)
  ) {
    return false;
  }

  // Check for the appropriate trigger condition
  if (options.triggerType === 'botInteraction') {
    if (options.interactionType === 'botMentioned') {
      // Check if the bot was mentioned in the message
      return !!message.mentions?.users?.has(client.user!.id);
    } else if (options.interactionType === 'messageReplied') {
      // Check if the message is a reply to a message from the bot
      return !!(
        message.reference && 
        message.reference.messageId && 
        message.mentions?.repliedUser?.id === client.user!.id
      );
    }
  } else if (options.triggerType === 'messageContent') {
    // Skip message content checks if content is not available
    if (!message.content) {
      // Special case: if we're looking for image attachments, we can continue
      if (options.matchPattern === 'containsImage') {
        return message.attachments && message.attachments.some(attachment => 
          attachment.contentType?.startsWith('image/'));
      }
      return false;
    }

    // Get message content and apply case sensitivity
    let content = message.content;
    let valueToMatch = options.matchValue || '';
    
    if (!options.caseSensitive && options.matchValue) {
      content = content.toLowerCase();
      valueToMatch = valueToMatch.toLowerCase();
    }

    // Perform pattern matching
    switch (options.matchPattern) {
      case 'botMention':
        return !!message.mentions?.users?.has(client.user!.id);
      case 'contains':
        return content.includes(valueToMatch);
      case 'containsImage':
        return message.attachments && message.attachments.some(attachment => 
          attachment.contentType?.startsWith('image/'));
      case 'endsWith':
        return content.endsWith(valueToMatch);
      case 'equals':
        return content === valueToMatch;
      case 'every':
        return true;
      case 'regex':
        try {
          const regex = new RegExp(options.regexPattern || '');
          return regex.test(content);
        } catch (error) {
          console.error('Invalid regex pattern:', error);
          return false;
        }
      case 'startsWith':
        return content.startsWith(valueToMatch);
      default:
        return false;
    }
  }

  return false;
};