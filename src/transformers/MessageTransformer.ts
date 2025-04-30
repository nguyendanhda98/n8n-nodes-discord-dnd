import { Attachment, Message } from "discord.js";

export async function messageToJson(message: Message): Promise<any> {
  const repliedMessage = await message.fetchReference().catch(() => null);
  return {
    channelId: message.channelId,
    guildId: message.guildId,
    id: message.id,
    createdTimestamp: message.createdTimestamp,
    content: message.content,
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

    repliedMessage,
  };
}
