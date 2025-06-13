import {
  Client,
  DMChannel,
  Message,
  MessageReaction,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { IDataObject, IExecuteFunctions } from "n8n-workflow";
import { ActionEventType } from "../../Interfaces/types";

export class ActionEventHandler {
  constructor(
    private readonly client: Client,
    private readonly actionInstance: IExecuteFunctions
  ) {}

  async setupEventHandler(action: string): Promise<IDataObject> {
    const data: IDataObject = {};

    switch (action) {
      case ActionEventType.SEND_TYPING:
        const channelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const channel = (await this.client.channels.fetch(channelId)) as
          | TextChannel
          | DMChannel
          | ThreadChannel;
        if (channel?.isTextBased()) {
          await channel.sendTyping();
          data.success = true;
          data.message = "Typing indicator sent successfully.";
        } else {
          throw new Error("The provided channel is not a text channel!");
        }
        break;

      case ActionEventType.SEND_MESSAGE:
        const sendAsDM = this.actionInstance.getNodeParameter(
          "sendAsDM",
          0,
          false
        ) as boolean;

        let messageChannel;

        if (sendAsDM) {
          const userId = this.actionInstance.getNodeParameter(
            "userId",
            0
          ) as string;

          try {
            const user = await this.client.users.fetch(userId);
            messageChannel = await user.createDM();
          } catch (error: any) {
            throw new Error(`Failed to create DM channel: ${error.message}`);
          }
        } else {
          const messageChannelId = this.actionInstance.getNodeParameter(
            "channelId",
            0
          ) as string;

          messageChannel = (await this.client.channels.fetch(
            messageChannelId
          )) as TextChannel | DMChannel | ThreadChannel;

          if (!messageChannel?.isTextBased()) {
            throw new Error("The provided channel is not a text channel!");
          }
        }

        let messageContent;
        let embeds = [];
        let files = [];

        // Get message content
        messageContent = this.actionInstance.getNodeParameter(
          "messageContent",
          0,
          ""
        ) as string;

        // Try to get embeds collection
        const embedsCollection = this.actionInstance.getNodeParameter(
          "embeds",
          0,
          { embed: [] }
        ) as { embed: any[] };

        if (
          embedsCollection &&
          embedsCollection.embed &&
          embedsCollection.embed.length > 0
        ) {
          embeds = embedsCollection.embed.map((embed) => {
            const inputMethod = embed.inputMethod || "fields";

            // Handle JSON embeds
            if (inputMethod === "json") {
              try {
                return JSON.parse(embed.jsonEmbed || "{}");
              } catch (error: any) {
                throw new Error(`Invalid JSON in embed: ${error.message}`);
              }
            }

            // Handle field-based embeds
            const processedEmbed: IDataObject = {
              type: embed.type || "rich",
              title: embed.title || undefined,
              description: embed.description || undefined,
              url: embed.url || undefined,
              color: embed.color || undefined,
              timestamp: embed.timestamp
                ? new Date(embed.timestamp).toISOString()
                : undefined,
            };

            // Process embed fields if they exist
            if (embed.fields && embed.fields.field) {
              processedEmbed.fields = embed.fields.field.map((field: any) => ({
                name: field.name || "Field",
                value: field.value || "Value",
                inline: field.inline || false,
              }));
            }

            // Process thumbnail and image
            if (embed.thumbnailUrl) {
              processedEmbed.thumbnail = { url: embed.thumbnailUrl };
            }

            if (embed.imageUrl) {
              processedEmbed.image = { url: embed.imageUrl };
            }

            // Process footer
            if (embed.footerText) {
              processedEmbed.footer = {
                text: embed.footerText,
                icon_url: embed.footerIconUrl || undefined,
              };
            }

            // Process author
            if (embed.authorName) {
              processedEmbed.author = {
                name: embed.authorName,
                url: embed.authorUrl || undefined,
                icon_url: embed.authorIconUrl || undefined,
              };
            }

            // Process video (if applicable)
            if (embed.type === "video" && embed.videoUrl) {
              processedEmbed.video = { url: embed.videoUrl };
            }

            // Process provider (if applicable)
            if (embed.providerName) {
              processedEmbed.provider = {
                name: embed.providerName,
                url: embed.providerUrl || undefined,
              };
            }

            return processedEmbed;
          });
        }

        // Handle JSON payload if specified
        try {
          // Check if JSON payload parameter exists and has a non-empty value
          const jsonPayload = this.actionInstance.getNodeParameter(
            "jsonPayload",
            0,
            ""
          ) as string;

          if (jsonPayload) {
            const parsedPayload = JSON.parse(jsonPayload);
            if (parsedPayload.content !== undefined) {
              messageContent = parsedPayload.content;
            }
            if (parsedPayload.embeds !== undefined) {
              embeds = parsedPayload.embeds;
            }
            // Files would need to be handled separately
          }
        } catch (error: any) {
          // If parsing fails or the parameter doesn't exist, continue with the regular fields
          // No need to throw an error here as we'll use the values from the regular fields
        }

        // Process file uploads if any
        const filesCollection = this.actionInstance.getNodeParameter(
          "files",
          0,
          { file: [] }
        ) as { file: any[] };

        if (filesCollection.file && filesCollection.file.length > 0) {
          for (const fileData of filesCollection.file) {
            if (fileData.binaryProperty) {
              const binaryData =
                this.actionInstance.helpers.getBinaryDataBuffer(
                  0,
                  fileData.binaryProperty
                );

              files.push({
                attachment: binaryData,
                name: fileData.fileName || "file",
              });
            }
          }
        }

        // Check for message to reply to
        const options = this.actionInstance.getNodeParameter(
          "options",
          0,
          {}
        ) as IDataObject;

        const messageOptions: any = {
          content: messageContent,
          embeds: embeds,
          files: files,
        };

        if (options.messageId) {
          messageOptions.reply = { messageReference: options.messageId };
        }

        const message = await messageChannel.send(messageOptions);

        data.success = true;
        data.message = "Message sent successfully.";
        data.messageId = message.id;
        break;

      case ActionEventType.DELETE_MESSAGE:
        const deleteChannelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const messageId = this.actionInstance.getNodeParameter(
          "messageId",
          0
        ) as string;

        const deleteChannel = (await this.client.channels.fetch(
          deleteChannelId
        )) as TextChannel | DMChannel | ThreadChannel;

        if (!deleteChannel?.isTextBased()) {
          throw new Error("The provided channel is not a text channel!");
        }

        try {
          const messageToDelete = await deleteChannel.messages.fetch(messageId);
          await messageToDelete.delete();
          data.success = true;
          data.message = "Message deleted successfully.";
        } catch (error: any) {
          throw new Error(`Failed to delete message: ${error.message}`);
        }
        break;

      case ActionEventType.EDIT_MESSAGE:
        const editChannelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const editMessageId = this.actionInstance.getNodeParameter(
          "messageId",
          0
        ) as string;
        const newContent = this.actionInstance.getNodeParameter(
          "newContent",
          0
        ) as string;

        const editChannel = (await this.client.channels.fetch(
          editChannelId
        )) as TextChannel | DMChannel | ThreadChannel;

        if (!editChannel?.isTextBased()) {
          throw new Error("The provided channel is not a text channel!");
        }

        try {
          const messageToEdit = await editChannel.messages.fetch(editMessageId);
          const editedMessage = await messageToEdit.edit(newContent);
          data.success = true;
          data.message = "Message edited successfully.";
          data.editedMessageId = editedMessage.id;
        } catch (error: any) {
          throw new Error(`Failed to edit message: ${error.message}`);
        }
        break;

      case ActionEventType.REACT_TO_MESSAGE:
        const reactChannelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const reactMessageId = this.actionInstance.getNodeParameter(
          "messageId",
          0
        ) as string;
        const emoji = this.actionInstance.getNodeParameter(
          "emoji",
          0
        ) as string;

        const reactChannel = (await this.client.channels.fetch(
          reactChannelId
        )) as TextChannel | DMChannel | ThreadChannel;

        if (!reactChannel?.isTextBased()) {
          throw new Error("The provided channel is not a text channel!");
        }

        try {
          const messageToReact = await reactChannel.messages.fetch(
            reactMessageId
          );
          await messageToReact.react(emoji);
          data.success = true;
          data.message = "Reaction added successfully.";
        } catch (error: any) {
          throw new Error(`Failed to add reaction: ${error.message}`);
        }
        break;

      case ActionEventType.PIN_MESSAGE:
        const pinChannelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const pinMessageId = this.actionInstance.getNodeParameter(
          "messageId",
          0
        ) as string;

        const pinChannel = (await this.client.channels.fetch(pinChannelId)) as
          | TextChannel
          | DMChannel
          | ThreadChannel;

        if (!pinChannel?.isTextBased()) {
          throw new Error("The provided channel is not a text channel!");
        }

        try {
          const messageToPin = await pinChannel.messages.fetch(pinMessageId);
          await messageToPin.pin();
          data.success = true;
          data.message = "Message pinned successfully.";
        } catch (error: any) {
          throw new Error(`Failed to pin message: ${error.message}`);
        }
        break;

      case ActionEventType.UNPIN_MESSAGE:
        const unpinChannelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const unpinMessageId = this.actionInstance.getNodeParameter(
          "messageId",
          0
        ) as string;

        const unpinChannel = (await this.client.channels.fetch(
          unpinChannelId
        )) as TextChannel | DMChannel | ThreadChannel;

        if (!unpinChannel?.isTextBased()) {
          throw new Error("The provided channel is not a text channel!");
        }

        try {
          const messageToUnpin = await unpinChannel.messages.fetch(
            unpinMessageId
          );
          await messageToUnpin.unpin();
          data.success = true;
          data.message = "Message unpinned successfully.";
        } catch (error: any) {
          throw new Error(`Failed to unpin message: ${error.message}`);
        }
        break;

      case ActionEventType.REMOVE_REACTION:
        const removeReactChannelId = this.actionInstance.getNodeParameter(
          "channelId",
          0
        ) as string;
        const removeReactMessageId = this.actionInstance.getNodeParameter(
          "messageId",
          0
        ) as string;
        const userId = this.actionInstance.getNodeParameter(
          "userId",
          0
        ) as string;
        const removeEmoji = this.actionInstance.getNodeParameter(
          "emoji",
          0
        ) as string;
        const all = this.actionInstance.getNodeParameter("all", 0) as boolean;
        const removeReactChannel = (await this.client.channels.fetch(
          removeReactChannelId
        )) as TextChannel | DMChannel | ThreadChannel;
        if (!removeReactChannel?.isTextBased()) {
          throw new Error("The provided channel is not a text channel!");
        }

        try {
          const messageToRemoveReact = await removeReactChannel.messages.fetch(
            removeReactMessageId
          );

          // If 'all' is true, remove all reactions from the message
          if (all) {
            // Remove all reactions from user if userId is provided and removeEmoji is not specified
            if (userId) {
              const user = await this.client.users.fetch(userId);
              if (!user) {
                throw new Error("User not found.");
              }
              const reactions = messageToRemoveReact.reactions.cache.filter(
                (reaction: MessageReaction) => reaction.users.cache.has(user.id)
              );
              try {
                for (const reaction of reactions.values()) {
                  await reaction.users.remove(user.id);
                }
              } catch (error: any) {
                throw new Error(
                  `Failed to remove reactions from user: ${error.message}`
                );
              }
              data.success = true;
              data.message = "All reactions from user removed successfully.";
              return data;
            }
            // If removeEmoji is specified, remove all reactions of that emoji
            if (removeEmoji) {
              try {
                await messageToRemoveReact.reactions.cache
                  .get(removeEmoji)
                  ?.remove();
                data.success = true;
                data.message = `All reactions for emoji ${removeEmoji} removed successfully.`;
                return data;
              } catch (error: any) {
                throw new Error(
                  `Failed to remove reactions for emoji ${removeEmoji}: ${error.message}`
                );
              }
            }

            // If no emoji is specified, remove all reactions
            // Remove all reactions from the message
            await messageToRemoveReact.reactions
              .removeAll()
              .catch((error: any) => {
                throw new Error(
                  `Failed to remove all reactions: ${error.message}`
                );
              });
            data.success = true;
            data.message = "All reactions removed successfully.";
            return data;
          }

          // Remove a specific reaction
          const reaction = messageToRemoveReact.reactions.cache.find(
            (r) =>
              r.emoji.name === removeEmoji || r.emoji.toString() === removeEmoji
          );

          if (reaction) {
            // If a user ID is provided, remove the reaction for that user
            if (userId) {
              const user = await this.client.users.fetch(userId);
              if (!user) {
                throw new Error("User not found.");
              }
              await reaction.users.remove(user.id).catch((error: any) => {
                throw new Error(
                  `Failed to remove reaction from user: ${error.message}`
                );
              });
            } else {
              // If no user ID is provided, remove the bot's reaction
              if (!this.client.user)
                throw new Error("Client user is not initialized");
              await reaction.users
                .remove(this.client.user.id)
                .catch((error: any) => {
                  throw new Error(
                    `Failed to remove reaction from the bot: ${error.message}`
                  );
                });
            }
            data.success = true;
            data.message = "Reaction removed successfully.";
          } else {
            throw new Error("Reaction not found on the message.");
          }
        } catch (error: any) {
          throw new Error(`Failed to remove reaction: ${error.message}`);
        }
        break;

      default:
        throw new Error(`Action "${action}" is not supported.`);
    }

    return data;
  }
}
