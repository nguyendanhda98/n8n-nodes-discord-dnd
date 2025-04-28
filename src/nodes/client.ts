import { Client, ClientOptions } from "discord.js";

/**
 * Initializes the Discord client, sets up events, and logs in
 * @param token Bot token for authentication
 * @param intents Array of GatewayIntentBits for the client
 * @throws Error if no token is provided
 * @returns Discord client instance
 */
export const initializeDiscordClient = async (
  token: string,
  clientOptions: ClientOptions
): Promise<Client> => {
  if (!token) {
    throw new Error("No bot token provided in credentials!");
  }

  const client = new Client(clientOptions);

  // Login to Discord
  await client.login(token);

  return client;
};
