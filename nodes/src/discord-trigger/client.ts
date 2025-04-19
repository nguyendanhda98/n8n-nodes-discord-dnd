import { ActivityType, Client, GatewayIntentBits } from 'discord.js';

/**
 * Creates and initializes a Discord client with the required intents
 * @returns Configured Discord client
 */
export const createDiscordClient = (): Client => {
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

  return client;
};

/**
 * Sets up the Discord client event listeners and status
 * @param client Discord client instance
 */
export const setupClientEvents = (client: Client): void => {
  // Set an activity status for the bot when ready
  client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);
    client.user?.setActivity('with n8n workflows', { type: ActivityType.Playing });
  });
};

/**
 * Initializes the Discord client, sets up events, and logs in
 * @param token Bot token for authentication
 * @returns Discord client instance
 */
export const initializeDiscordClient = async (token: string): Promise<Client> => {
  if (!token) {
    throw new Error('No bot token provided in credentials!');
  }

  const client = createDiscordClient();
  setupClientEvents(client);
  
  // Login to Discord
  await client.login(token);
  
  return client;
};