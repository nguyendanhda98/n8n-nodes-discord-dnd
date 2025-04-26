import { Message } from "discord.js";

export async function messageToJson(message: Message): Promise<any> {
  const repliedMessage = await message.fetchReference().catch(() => null);
  return {
    ...message,
    repliedMessage,
  };
}
