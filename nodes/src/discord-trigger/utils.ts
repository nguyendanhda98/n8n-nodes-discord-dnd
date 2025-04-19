import { ChannelType, TextChannel, ThreadChannel } from 'discord.js';

/**
 * Get channel name safely handling different channel types
 * @param channel The Discord channel to get name from
 * @returns The channel name or null if not available
 */
export const getChannelName = (channel: any): string | null => {
  if (!channel) return null;
  
  // Handle different channel types explicitly
  if (channel instanceof TextChannel || channel instanceof ThreadChannel) {
    return channel.name;
  }
  
  // For DM channels
  if (channel.type === ChannelType.DM) {
    return 'Direct Message';
  }
  
  // Fallback for other channel types that might have a name property
  if ('name' in channel && typeof channel.name === 'string') {
    return channel.name;
  }
  
  return 'Unknown Channel';
};