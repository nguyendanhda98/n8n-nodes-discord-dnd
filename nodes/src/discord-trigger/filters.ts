import { Message, PartialMessage } from 'discord.js';
import { IFilterOptions } from './types';
import { getChannelName } from './utils';

/**
 * Check if the message should be filtered based on server
 * @param message Discord message
 * @param options Filter options
 * @returns Boolean indicating if message passes server filter
 */
export const isServerAllowed = (message: Message | PartialMessage, options: IFilterOptions): boolean => {
  if (!options.filterByServers || options.serverIds.length === 0) return true;
  
  // Allow if guildId is in the serverIds list or guild name matches
  if (message.guild && options.serverIds.some(id => 
    id === message.guild?.id || 
    message.guild?.name.toLowerCase() === id.toLowerCase())) {
    return true;
  }
  
  return false;
};

/**
 * Check if the message should be filtered based on channel
 * @param message Discord message
 * @param options Filter options
 * @returns Boolean indicating if message passes channel filter
 */
export const isChannelAllowed = (message: Message | PartialMessage, options: IFilterOptions): boolean => {
  if (!options.filterByChannels || options.channelIds.length === 0) return true;
  
  const channelName = getChannelName(message.channel);
  
  // Allow if channelId is in the channelIds list or channel name matches
  if (options.channelIds.some(id => 
    id === message.channelId || 
    (channelName && channelName.toLowerCase() === id.toLowerCase()))) {
    return true;
  }
  
  return false;
};

/**
 * Check if the message should be filtered based on user roles
 * @param message Discord message
 * @param options Filter options
 * @returns Boolean indicating if message passes role filter
 */
export const isRoleAllowed = (message: Message | PartialMessage, options: IFilterOptions): boolean => {
  if (!options.filterByRoles || options.roleIds.length === 0) return true;
  
  // If not in a guild, can't filter by role
  if (!message.guild || !message.member) return false;
  
  // Allow if user has any of the specified roles
  const memberRoles = message.member.roles?.cache;
  if (memberRoles) {
    return options.roleIds.some(id => 
      memberRoles.some(role => 
        role.id === id || 
        role.name.toLowerCase() === id.toLowerCase()
      )
    );
  }
  
  return false;
};