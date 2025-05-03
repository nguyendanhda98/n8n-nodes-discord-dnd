import { Attachment, Message } from "discord.js";

export async function messageToJson(message: Message): Promise<any> {
  const repliedMessage = await message.fetchReference().catch(() => null);
  // check if the messsage is bot mentioned then return the original message
  let content: string = message.content;
  if (message.mentions.has(message.client.user)) {
    const botId = message.client.user.id;
    const botMentionRegex = new RegExp(`<@!?${botId}>\\s*`, "g");
    content = message.content.replace(botMentionRegex, "").trim();
  }
  const data = {
    channelId: message.channelId,
    guildId: message.guildId,
    id: message.id,
    createdTimestamp: message.createdTimestamp,
    content,
    pinned: message.pinned,
    embeds: message.embeds.map((embed) => embed.toJSON()),
    attachments: message.attachments.map((attachment: Attachment) => ({
      ...attachment,
    })),
    stickers: message.stickers.map((sticker) => ({
      ...sticker,
    })),
    editedTimestamp: message.editedTimestamp,
    reactions: message.reactions.cache.map((reaction) => ({
      ...reaction,
    })),
    mentions: {
      ...message.mentions,
    },
    author: {
      ...message.author,
    },
    repliedMessage: { ...repliedMessage },
  };
  return data;
}
