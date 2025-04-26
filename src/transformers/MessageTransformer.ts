import { Message } from "discord.js";

export async function messageToJson(message: Message): Promise<any> {
  return {
    ...message,
    repliedMessage: await message.fetchReference(),
  };
}
