import { Client, Events, GatewayIntentBits, Message, PartialMessage, ActivityType, ChannelType, TextChannel, DMChannel, ThreadChannel, Guild } from 'discord.js';
import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';

export class DiscordTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Discord Trigger',
		name: 'discordTrigger',
		icon: 'file:discord.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Discord events occur',
		defaults: {
			name: 'Discord Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'discordApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				options: [
					{
						name: 'Message Content',
						value: 'messageContent',
						description: 'Triggered based on message content patterns',
					},
					{
						name: 'Bot Interaction',
						value: 'botInteraction',
						description: 'Triggered when users interact with the bot',
					},
				],
				default: 'messageContent',
				required: true,
			},
			// Bot Interaction Options
			{
				displayName: 'Interaction Type',
				name: 'interactionType',
				type: 'options',
				displayOptions: {
					show: {
						triggerType: ['botInteraction'],
					},
				},
				options: [
					{
						name: 'Bot Mentioned',
						value: 'botMentioned',
						description: 'Triggered when someone mentions the bot in a message',
					},
					{
						name: 'Message Replied To',
						value: 'messageReplied',
						description: 'Triggered when someone replies to a message from the bot',
					},
				],
				default: 'botMentioned',
				required: true,
			},
			// Message Content Options
			{
				displayName: 'Match Pattern',
				name: 'matchPattern',
				type: 'options',
				displayOptions: {
					show: {
						triggerType: ['messageContent'],
					},
				},
				options: [
					{
						name: 'Bot Mention',
						value: 'botMention',
						description: 'The bot has to be mentioned somewhere in the message',
					},
					{
						name: 'Contains',
						value: 'contains',
						description: 'Match the value in any position in the message',
					},
					{
						name: 'Contains Image',
						value: 'containsImage',
						description: 'Triggers when a message contains an image attachment',
					},
					{
						name: 'Ends With',
						value: 'endsWith',
						description: 'Match the message ending with the specified value',
					},
					{
						name: 'Equals',
						value: 'equals',
						description: 'Match the exact same value',
					},
					{
						name: 'Every',
						value: 'every',
						description: 'Triggers on every discord message',
					},
					{
						name: 'Regex',
						value: 'regex',
						description: 'Match the custom ECMAScript regex provided',
					},
					{
						name: 'Starts With',
						value: 'startsWith',
						description: 'Match the message beginning with the specified value',
					},
				],
				default: 'contains',
				required: true,
			},
			{
				displayName: 'Value to Match',
				name: 'matchValue',
				type: 'string',
				default: '',
				description: 'The text value to match in the message',
				required: true,
				displayOptions: {
					show: {
						triggerType: ['messageContent'],
						matchPattern: ['contains', 'endsWith', 'equals', 'startsWith'],
					},
				},
			},
			{
				displayName: 'Regex Pattern',
				name: 'regexPattern',
				type: 'string',
				default: '',
				placeholder: '^\\w+$',
				description: 'The regular expression to match against the message content',
				required: true,
				displayOptions: {
					show: {
						triggerType: ['messageContent'],
						matchPattern: ['regex'],
					},
				},
			},
			{
				displayName: 'Case Sensitive',
				name: 'caseSensitive',
				type: 'boolean',
				default: false,
				description: 'Whether the matching should be case sensitive',
				displayOptions: {
					show: {
						triggerType: ['messageContent'],
						matchPattern: ['contains', 'endsWith', 'equals', 'startsWith'],
					},
				},
			},
			// Common Options
			{
				displayName: 'Include Bot Messages',
				name: 'includeBotMessages',
				type: 'boolean',
				default: false,
				description: 'Whether to include messages from other bots or only from users',
			},
			{
				displayName: 'Filter by Servers',
				name: 'filterByServers',
				type: 'boolean',
				default: false,
				description: 'Whether to filter messages by specific servers',
			},
			{
				displayName: 'Server Names or IDs',
				name: 'serverIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of server names or IDs to listen to (empty for all servers)',
				displayOptions: {
					show: {
						filterByServers: [true],
					},
				},
				placeholder: 'server1Name, 1234567890123456',
			},
			{
				displayName: 'Filter by Channels',
				name: 'filterByChannels',
				type: 'boolean',
				default: false,
				description: 'Whether to filter messages by specific channels',
			},
			{
				displayName: 'Listen to Channels',
				name: 'channelIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of channel names or IDs to listen to (empty for all channels)',
				displayOptions: {
					show: {
						filterByChannels: [true],
					},
				},
				placeholder: 'general, 1234567890123456',
			},
			{
				displayName: 'Filter by Roles',
				name: 'filterByRoles',
				type: 'boolean',
				default: false,
				description: 'Whether to filter messages by user roles',
			},
			{
				displayName: 'Listen to Roles',
				name: 'roleIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of role names or IDs to listen to (empty for all roles)',
				displayOptions: {
					show: {
						filterByRoles: [true],
					},
				},
				placeholder: 'admin, 1234567890123456',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('discordApi') as ICredentialDataDecryptedObject;
		
		// Get parameters
		const triggerType = this.getNodeParameter('triggerType', 'messageContent') as string;
		const includeBotMessages = this.getNodeParameter('includeBotMessages', false) as boolean;
		
		// Filter parameters
		const filterByServers = this.getNodeParameter('filterByServers', false) as boolean;
		const serverIds = filterByServers ? (this.getNodeParameter('serverIds', '') as string).split(',').map(id => id.trim()) : [];
		
		const filterByChannels = this.getNodeParameter('filterByChannels', false) as boolean;
		const channelIds = filterByChannels ? (this.getNodeParameter('channelIds', '') as string).split(',').map(id => id.trim()) : [];
		
		const filterByRoles = this.getNodeParameter('filterByRoles', false) as boolean;
		const roleIds = filterByRoles ? (this.getNodeParameter('roleIds', '') as string).split(',').map(id => id.trim()) : [];

		// Message content parameters
		let matchPattern = '';
		let matchValue = '';
		let regexPattern = '';
		let caseSensitive = false;
		let interactionType = '';

		if (triggerType === 'messageContent') {
			matchPattern = this.getNodeParameter('matchPattern', '') as string;
			
			if (['contains', 'endsWith', 'equals', 'startsWith'].includes(matchPattern)) {
				matchValue = this.getNodeParameter('matchValue', '') as string;
				caseSensitive = this.getNodeParameter('caseSensitive', false) as boolean;
			} else if (matchPattern === 'regex') {
				regexPattern = this.getNodeParameter('regexPattern', '') as string;
			}
		} else if (triggerType === 'botInteraction') {
			interactionType = this.getNodeParameter('interactionType', 'botMentioned') as string;
		}

		if (!credentials.botToken) {
			throw new Error('No bot token provided in credentials!');
		}

		// Initialize Discord client with necessary intents
		const client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildMembers,
			],
		});

		// Set up response data
		const responseData: ITriggerResponse = {
			manualTriggerFunction: async () => {
				// This function will be executed when the workflow is manually triggered
				// Don't need to do anything here as we only want the workflow to be triggered by Discord events
				return;
			},
		};

		// Check if the message should be filtered based on server
		const isServerAllowed = (message: Message | PartialMessage): boolean => {
			if (!filterByServers || serverIds.length === 0) return true;
			
			// Allow if guildId is in the serverIds list or guild name matches
			if (message.guild && serverIds.some(id => 
				id === message.guild?.id || 
				message.guild?.name.toLowerCase() === id.toLowerCase())) {
				return true;
			}
			
			return false;
		};

		// Check if the message should be filtered based on channel
		const isChannelAllowed = (message: Message | PartialMessage): boolean => {
			if (!filterByChannels || channelIds.length === 0) return true;
			
			const channelName = getChannelName(message.channel);
			
			// Allow if channelId is in the channelIds list or channel name matches
			if (channelIds.some(id => 
				id === message.channelId || 
				(channelName && channelName.toLowerCase() === id.toLowerCase()))) {
				return true;
			}
			
			return false;
		};

		// Check if the message should be filtered based on user roles
		const isRoleAllowed = (message: Message | PartialMessage): boolean => {
			if (!filterByRoles || roleIds.length === 0) return true;
			
			// If not in a guild, can't filter by role
			if (!message.guild || !message.member) return false;
			
			// Allow if user has any of the specified roles
			const memberRoles = message.member.roles?.cache;
			if (memberRoles) {
				return roleIds.some(id => 
					memberRoles.some(role => 
						role.id === id || 
						role.name.toLowerCase() === id.toLowerCase()
					)
				);
			}
			
			return false;
		};

		// Function to determine if a message should trigger the workflow
		const shouldTrigger = (message: Message | PartialMessage): boolean => {
			// Ignore messages from bots if not explicitly included
			if (message.author?.bot && !includeBotMessages) {
				return false;
			}

			// Check if message passes server, channel, and role filters
			if (!isServerAllowed(message) || !isChannelAllowed(message) || !isRoleAllowed(message)) {
				return false;
			}

			// Check for the appropriate trigger condition
			if (triggerType === 'botInteraction') {
				if (interactionType === 'botMentioned') {
					// Check if the bot was mentioned in the message
					return !!message.mentions?.users?.has(client.user!.id);
				} else if (interactionType === 'messageReplied') {
					// Check if the message is a reply to a message from the bot
					return !!(message.reference && 
						message.reference.messageId && 
						message.mentions?.repliedUser?.id === client.user!.id);
				}
			} else if (triggerType === 'messageContent') {
				// Skip message content checks if content is not available
				if (!message.content) {
					// Special case: if we're looking for image attachments, we can continue
					if (matchPattern === 'containsImage') {
						return message.attachments && message.attachments.some(attachment => 
							attachment.contentType?.startsWith('image/'));
					}
					return false;
				}

				// Get message content and apply case sensitivity
				let content = message.content;
				let valueToMatch = matchValue;
				
				if (!caseSensitive && matchValue) {
					content = content.toLowerCase();
					valueToMatch = matchValue.toLowerCase();
				}

				// Perform pattern matching
				switch (matchPattern) {
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
							const regex = new RegExp(regexPattern);
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

		// Get channel name safely handling different channel types
		const getChannelName = (channel: any): string | null => {
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

		// Handle message creation
		client.on(Events.MessageCreate, async (message) => {
			if (shouldTrigger(message)) {
				await this.emit([this.helpers.returnJsonArray([
					{
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
						matchPattern: triggerType === 'messageContent' ? matchPattern : interactionType,
						rawData: message,
					},
				])]);
			}
		});

		// Set an activity status for the bot
		client.once(Events.ClientReady, () => {
			console.log(`Discord bot logged in as ${client.user?.tag}`);
			client.user?.setActivity('with n8n workflows', { type: ActivityType.Playing });
		});

		// Login to Discord
		await client.login(credentials.botToken as string);

		// This function will be called when the node is deactivated
		const closeFunction = async () => {
			console.log('Disconnecting from Discord...');
			client.destroy();
		};

		return {
			...responseData,
			closeFunction,
		};
	}
}