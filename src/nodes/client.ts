import { ActivityType, Client, GatewayIntentBits } from "discord.js";

/**
 * Sets up the Discord client event listeners and status
 * @param client Discord client instance
 */
export const setupClientEvents = (client: Client): void => {
  // Set an activity status for the bot when ready
  client.once("ready", () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);
    client.user?.setActivity("with n8n workflows", {
      type: ActivityType.Playing,
    });
  });
};

/**
 * Initializes the Discord client, sets up events, and logs in
 * @param token Bot token for authentication
 * @param intents Array of GatewayIntentBits for the client
 * @throws Error if no token is provided
 * @returns Discord client instance
 */
export const initializeDiscordClient = async (
  token: string,
  intents: GatewayIntentBits[]
): Promise<Client> => {
  if (!token) {
    throw new Error("No bot token provided in credentials!");
  }

  const client = new Client({
    intents: intents,
  });

  setupClientEvents(client);

  // Login to Discord
  await client.login(token);

  return client;
};
