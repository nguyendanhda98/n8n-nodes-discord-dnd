import { Client, GatewayIntentBits } from "discord.js";

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
    intents,
  });

  // Login to Discord
  await client.login(token);

  return client;
};
