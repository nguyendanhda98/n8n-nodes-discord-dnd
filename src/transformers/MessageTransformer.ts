import { Message } from "discord.js";

/**
 * Fetches the referenced message and returns its content
 * @param message The message that contains a reference to another message
 * @returns The referenced message content or null if no reference exists
 */
export async function fetchReferencedMessage(message: Message): Promise<string | null> {
  if (message.reference && message.reference.messageId) {
    try {
      const referencedMessage = await message.fetchReference();
      return referencedMessage.content;
    } catch (error) {
      console.error('Error fetching referenced message:', error);
      return null;
    }
  }
  return null;
}

export function messageToJson(message: Message): any {
  const n8nMessage: any = {
    id: message.id,
    content: message.content,
    channelId: message.channelId,
    guildId: message.guildId,
    createdTimestamp: message.createdTimestamp,
    type: message.type,
    system: message.system,
    isDirectMessage: !message.guild,
    author: {
      id: message.author?.id,
      username: message.author?.username,
      discriminator: message.author?.discriminator,
      globalName: message.author?.globalName,
      avatar: message.author?.avatar,
      bot: message.author?.bot,
      system: message.author?.system,
      flags: message.author?.flags?.toArray(),
      banner: message.author?.banner,
      accentColor: message.author?.accentColor,
      avatarDecoration: message.author?.avatarDecoration,
    },
    pinned: message.pinned,
    tts: message.tts,
    nonce: message.nonce,
    embeds: message.embeds?.map((embed: any) => ({
      title: embed.title,
      description: embed.description,
      url: embed.url,
      timestamp: embed.timestamp,
      color: embed.color,
      fields: embed.fields?.map((field: any) => ({
        name: field.name,
        value: field.value,
        inline: field.inline,
      })),
      author: embed.author
        ? {
            name: embed.author.name,
            url: embed.author.url,
            iconURL: embed.author.iconURL,
          }
        : null,
      footer: embed.footer
        ? {
            text: embed.footer.text,
            iconURL: embed.footer.iconURL,
          }
        : null,
      image: embed.image ? { url: embed.image.url } : null,
      thumbnail: embed.thumbnail ? { url: embed.thumbnail.url } : null,
      video: embed.video ? { url: embed.video.url } : null,
    })),
    components: message.components?.map((component: any) => ({
      type: component.type,
      components: component.components?.map((comp: any) => ({
        type: comp.type,
        customId: comp.customId,
        label: comp.label,
        style: comp.style,
        url: comp.url,
        disabled: comp.disabled,
      })),
    })),
    attachments: message.attachments?.map((attachment: any) => ({
      id: attachment.id,
      url: attachment.url,
      filename: attachment.filename,
      size: attachment.size,
      contentType: attachment.contentType,
      width: attachment.width,
      height: attachment.height,
    })),
    stickers: message.stickers?.map((sticker: any) => ({
      id: sticker.id,
      name: sticker.name,
      formatType: sticker.formatType,
    })),
    position: message.position,
    roleSubscriptionData: message.roleSubscriptionData,
    editedTimestamp: message.editedTimestamp,
    mentions: {
      everyone: message.mentions?.everyone,
      users:
        message.mentions?.users?.map((user: any) => ({
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          globalName: user.globalName,
          avatar: user.avatar,
        })) || [],
      roles:
        message.mentions?.roles?.map((role: any) => ({
          id: role.id,
          name: role.name,
          color: role.color,
        })) || [],
      crosspostedChannels:
        message.mentions?.crosspostedChannels?.map((channel: any) => ({
          id: channel.id,
          guildId: channel.guildId,
          type: channel.type,
        })) || [],
      repliedUser: message.mentions?.repliedUser
        ? {
            id: message.mentions.repliedUser.id,
            username: message.mentions.repliedUser.username,
            discriminator: message.mentions.repliedUser.discriminator,
            globalName: message.mentions.repliedUser.globalName,
            avatar: message.mentions.repliedUser.avatar,
          }
        : null,
      repliedMessage: message.reference && message.reference.messageId
        ? {
            id: message.reference.messageId,
            channelId: message.reference.channelId,
            guildId: message.reference.guildId,
            content: null, // Will be populated if fetchReferencedMessage is called
          }
        : null,
      members:
        message.mentions?.members?.map((member: any) => ({
          id: member.id,
          nickname: member.nickname,
        })) || [],
      channels:
        message.mentions?.channels?.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
        })) || [],
    },
    webhookId: message.webhookId,
    applicationId: message.applicationId,
    activity: message.activity,
    flags: message.flags?.toArray(),
    reference: message.reference
      ? {
          channelId: message.reference.channelId,
          guildId: message.reference.guildId,
          messageId: message.reference.messageId,
        }
      : null,
    interaction: message.interactionMetadata
      ? {
          id: message.interactionMetadata.id,
          type: message.interactionMetadata.type,
          userId: message.interactionMetadata.user?.id,
        }
      : null,
    poll: message.poll
      ? {
          question: message.poll.question?.text,
          answers: message.poll.answers?.map((answer: any) => ({
            answerId: answer.answerId,
            text: answer.text,
            voteCount: answer.voteCount,
          })),
          expiresTimestamp: message.poll.expiresTimestamp,
          allowMultiselect: message.poll.allowMultiselect,
          layoutType: message.poll.layoutType,
          resultsFinalized: message.poll.resultsFinalized,
        }
      : null,
    messageSnapshots: message.messageSnapshots?.map((snapshot: any) => ({
      message: {
        id: snapshot.message.id,
        content: snapshot.message.content,
      },
    })),
    call: message.call
      ? {
          endedTimestamp: message.call.endedTimestamp,
          participants: message.call.participants?.map((user: any) => user.id),
        }
      : null,
  };
  return n8nMessage;
}

