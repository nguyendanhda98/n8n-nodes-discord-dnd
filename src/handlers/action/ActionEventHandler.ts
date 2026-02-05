import {
  Client,
  DMChannel,
  Message,
  MessageReaction,
  TextChannel,
  ThreadChannel,
  PermissionsBitField,
  PermissionOverwriteOptions,
} from "discord.js";
import { IDataObject, IExecuteFunctions } from "n8n-workflow";
import { ActionEventType } from "../../Interfaces/types";

export class ActionEventHandler {
  constructor(
    private readonly client: Client,
    private readonly actionInstance: IExecuteFunctions
  ) { }

  /**
   * Fetch all users who have RSVP'd (interested) in a guild scheduled event
   */
  private async fetchEventInterestedUsers(
    guildId: string,
    eventId: string
  ): Promise<string[]> {
    const botToken = this.client.token;
    if (!botToken) {
      throw new Error("Bot token is not available");
    }

    const limit = 100;
    let before: string | undefined = undefined;
    const allUserIds: string[] = [];

    try {
      while (true) {
        const params = new URLSearchParams({
          limit: String(limit),
          with_member: "false", // We only need user IDs
        });
        if (before) {
          params.set("before", before);
        }

        const response = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/scheduled-events/${eventId}/users?${params.toString()}`,
          {
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Discord API error ${response.status}: ${errorText}`
          );
        }

        const chunk = await response.json();

        // Extract user IDs from the response
        if (Array.isArray(chunk)) {
          const userIds = chunk
            .map((item: any) => item.user?.id)
            .filter((id: string | undefined) => id !== undefined);
          allUserIds.push(...userIds);

          // If we got fewer results than the limit, we've reached the end
          if (chunk.length < limit) {
            break;
          }

          // Use the last user ID for pagination
          const lastUserId = chunk[chunk.length - 1]?.user?.id;
          if (!lastUserId) {
            break;
          }
          before = lastUserId;
        } else {
          break;
        }
      }
    } catch (error: any) {
      // Log error but don't fail the entire operation
      console.error(`Failed to fetch interested users: ${error.message}`);
      return [];
    }

    return allUserIds;
  }

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
        // Get message content
        let messageContent = this.actionInstance.getNodeParameter(
          "messageContent",
          0,
          ""
        ) as string;

        let embeds: any[] = [];
        let files: any[] = [];

        // Process embeds
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
                return JSON.parse(embed.jsonPayload || "{}");
              } catch (error: any) {
                throw new Error(`Invalid JSON in embed: ${error.message}`);
              }
            }

            // Handle field-based embeds
            const processedEmbed: IDataObject = {};

            if (embed.description) processedEmbed.description = embed.description;
            if (embed.title) processedEmbed.title = embed.title;
            if (embed.url) processedEmbed.url = embed.url;
            if (embed.color) processedEmbed.color = embed.color;
            if (embed.timestamp) {
              processedEmbed.timestamp = new Date(embed.timestamp).toISOString();
            }

            // Process thumbnail and image
            if (embed.thumbnailUrl) {
              processedEmbed.thumbnail = { url: embed.thumbnailUrl };
            }

            if (embed.imageUrl) {
              processedEmbed.image = { url: embed.imageUrl };
            }

            // Process author
            if (embed.authorName) {
              processedEmbed.author = {
                name: embed.authorName,
              };
            }

            // Process video
            if (embed.videoUrl) {
              processedEmbed.video = { url: embed.videoUrl };
            }

            return processedEmbed;
          });

          // Filter out empty embeds
          embeds = embeds.filter(e => Object.keys(e).length > 0);
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

        // Check if we have anything to send
        if (!messageContent && embeds.length === 0 && files.length === 0) {
          throw new Error("Cannot send an empty message! Please provide at least one of: Message Content, Embeds, or Files.");
        }

        // Get options
        const options = this.actionInstance.getNodeParameter(
          "options",
          0,
          {}
        ) as IDataObject;

        // Get send to destination
        const sendTo = this.actionInstance.getNodeParameter(
          "sendTo",
          0,
          "channel"
        ) as string;

        let messageChannel;

        if (sendTo === "user") {
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
          const channelId = this.actionInstance.getNodeParameter(
            "channelId",
            0
          ) as string;

          messageChannel = (await this.client.channels.fetch(
            channelId
          )) as TextChannel | DMChannel | ThreadChannel;

          if (!messageChannel?.isTextBased()) {
            throw new Error("The provided channel is not a text channel!");
          }
        }

        const messageOptions: any = {
          content: messageContent || undefined,
          embeds: embeds.length > 0 ? embeds : undefined,
          files: files.length > 0 ? files : undefined,
        };

        // Add flags if present
        if (options.flags && Array.isArray(options.flags)) {
          let flags = 0;
          const flagsArray = options.flags as string[];
          if (flagsArray.includes("suppressEmbeds")) {
            flags |= 1 << 2; // SUPPRESS_EMBEDS = 1 << 2
          }
          if (flagsArray.includes("suppressNotifications")) {
            flags |= 1 << 12; // SUPPRESS_NOTIFICATIONS = 1 << 12
          }
          if (flags > 0) {
            messageOptions.flags = flags;
          }
        }

        // Add reply if present
        if (options.messageId) {
          messageOptions.reply = { messageReference: options.messageId };
        }

        try {
          const message = await messageChannel.send(messageOptions);

          data.success = true;
          data.message = "Message sent successfully.";
          data.messageId = message.id;
        } catch (error: any) {
          console.error("Discord API Send Error:", error);
          throw new Error(`Failed to send message: ${error.message}`);
        }
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
              try {
                const reactions = messageToRemoveReact.reactions.cache.filter(
                  (reaction: MessageReaction) =>
                    reaction.users.cache.has(userId)
                );

                for (const reaction of reactions.values()) {
                  await reaction.users.remove(userId);
                }
                data.success = true;
                data.message = "All reactions from user removed successfully.";
                return data;
              } catch (error: any) {
                throw new Error(
                  `Failed to remove reactions from user: ${error.message}`
                );
              }
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
              await reaction.users.remove(userId).catch((error: any) => {
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

      case ActionEventType.GET_GUILD_SCHEDULED_EVENT:
        const getGuildScheduledEventId = this.actionInstance.getNodeParameter(
          "guildScheduledEventId",
          0
        ) as string;
        const getGuildId = this.actionInstance.getNodeParameter(
          "guildId",
          0
        ) as string;

        try {
          const guild = await this.client.guilds.fetch(getGuildId);
          const guildScheduledEvent = await guild.scheduledEvents.fetch(
            getGuildScheduledEventId
          );

          if (!guildScheduledEvent) {
            throw new Error("Guild scheduled event not found.");
          }

          // Get all information about the event
          data.id = guildScheduledEvent.id;
          data.guildId = guildScheduledEvent.guildId;
          data.channelId = guildScheduledEvent.channelId;
          data.creatorId = guildScheduledEvent.creatorId;
          data.name = guildScheduledEvent.name;
          data.description = guildScheduledEvent.description;
          data.scheduledStartTimestamp = guildScheduledEvent.scheduledStartTimestamp;
          data.scheduledEndTimestamp = guildScheduledEvent.scheduledEndTimestamp;
          data.privacyLevel = guildScheduledEvent.privacyLevel;
          data.status = guildScheduledEvent.status;
          data.entityType = guildScheduledEvent.entityType;
          data.entityId = guildScheduledEvent.entityId;
          data.entityMetadata = guildScheduledEvent.entityMetadata;
          data.userCount = guildScheduledEvent.userCount;
          data.image = guildScheduledEvent.image;
          data.createdTimestamp = guildScheduledEvent.createdTimestamp;
          data.url = guildScheduledEvent.url;

          // Add creator information if available
          if (guildScheduledEvent.creator) {
            data.creator = {
              id: guildScheduledEvent.creator.id,
              username: guildScheduledEvent.creator.username,
              discriminator: guildScheduledEvent.creator.discriminator,
              avatar: guildScheduledEvent.creator.avatar,
              bot: guildScheduledEvent.creator.bot,
            };
          }

          // Fetch interested users (RSVPed users)
          const interestedUserIds = await this.fetchEventInterestedUsers(
            getGuildId,
            getGuildScheduledEventId
          );
          data.interestedUsers = interestedUserIds;
          data.interestedUsersCount = interestedUserIds.length;

          data.success = true;
        } catch (error: any) {
          throw new Error(
            `Failed to get guild scheduled event: ${error.message}`
          );
        }
        break;

      case ActionEventType.GUILD_SCHEDULED_EVENT_UPDATE:
        const guildScheduledEventId = this.actionInstance.getNodeParameter(
          "guildScheduledEventId",
          0
        ) as string;
        const guildId = this.actionInstance.getNodeParameter(
          "guildId",
          0
        ) as string;
        const updateFields = this.actionInstance.getNodeParameter(
          "updateFields",
          0,
          {}
        ) as IDataObject;

        const name = updateFields.name as string | undefined;
        const scheduledStartTime = updateFields.scheduledStartTime as
          | string
          | undefined;
        const scheduledEndTime = updateFields.scheduledEndTime as
          | string
          | undefined;
        const description = updateFields.description as string | undefined;
        try {
          const guild = await this.client.guilds.fetch(guildId);
          const guildScheduledEvent = await guild.scheduledEvents.fetch(
            guildScheduledEventId
          );

          if (!guildScheduledEvent) {
            throw new Error("Guild scheduled event not found.");
          }

          const updateData = Object.fromEntries(
            Object.entries({
              name,
              scheduledStartTime,
              scheduledEndTime,
              description,
            }).filter(([_, v]) => v !== undefined)
          );

          await guildScheduledEvent.edit(updateData);

          data.success = true;
          data.message = "Guild scheduled event updated successfully.";
        } catch (error: any) {
          throw new Error(
            `Failed to update guild scheduled event: ${error.message}`
          );
        }
        break;

      case ActionEventType.CREATE_GUILD_SCHEDULED_EVENT:
        const createEventGuildId = this.actionInstance.getNodeParameter(
          "guildId",
          0
        ) as string;
        const eventName = this.actionInstance.getNodeParameter(
          "eventName",
          0
        ) as string;
        const eventStartTime = this.actionInstance.getNodeParameter(
          "eventStartTime",
          0
        ) as string;
        const eventEntityType = this.actionInstance.getNodeParameter(
          "eventEntityType",
          0
        ) as number;
        const eventPrivacyLevel = this.actionInstance.getNodeParameter(
          "eventPrivacyLevel",
          0
        ) as number;
        const eventChannelId = this.actionInstance.getNodeParameter(
          "eventChannelId",
          0,
          ""
        ) as string;
        const eventOptions = this.actionInstance.getNodeParameter(
          "eventOptions",
          0,
          {}
        ) as IDataObject;

        try {
          const createEventGuild = await this.client.guilds.fetch(createEventGuildId);

          const createEventData: any = {
            name: eventName,
            scheduledStartTime: new Date(eventStartTime),
            privacyLevel: eventPrivacyLevel,
            entityType: eventEntityType,
          };

          // Add channel for Voice or Stage Instance
          if ((eventEntityType === 1 || eventEntityType === 2) && eventChannelId) {
            createEventData.channel = eventChannelId;
          }

          // Add optional fields
          if (eventOptions.description) {
            createEventData.description = eventOptions.description as string;
          }
          if (eventOptions.scheduledEndTime) {
            createEventData.scheduledEndTime = new Date(eventOptions.scheduledEndTime as string);
          }
          if (eventOptions.entityMetadataLocation) {
            createEventData.entityMetadata = {
              location: eventOptions.entityMetadataLocation as string,
            };
          }
          if (eventOptions.image) {
            createEventData.image = eventOptions.image as string;
          }

          const createdEvent = await createEventGuild.scheduledEvents.create(createEventData);

          data.success = true;
          data.message = "Guild scheduled event created successfully.";
          data.eventId = createdEvent.id;
          data.eventUrl = createdEvent.url;
          data.event = {
            id: createdEvent.id,
            name: createdEvent.name,
            description: createdEvent.description,
            scheduledStartTimestamp: createdEvent.scheduledStartTimestamp,
            scheduledEndTimestamp: createdEvent.scheduledEndTimestamp,
            status: createdEvent.status,
            entityType: createdEvent.entityType,
            url: createdEvent.url,
          };
        } catch (error: any) {
          throw new Error(
            `Failed to create guild scheduled event: ${error.message}`
          );
        }
        break;

      case ActionEventType.GET_MANY_GUILD_SCHEDULED_EVENTS:
        const getManyEventsGuildId = this.actionInstance.getNodeParameter(
          "guildId",
          0
        ) as string;

        try {
          const getManyEventsGuild = await this.client.guilds.fetch(getManyEventsGuildId);
          const events = await getManyEventsGuild.scheduledEvents.fetch();

          // Fetch interested users for each event
          const eventsArray = await Promise.all(
            events.map(async (event) => {
              const interestedUserIds = await this.fetchEventInterestedUsers(
                getManyEventsGuildId,
                event.id
              );

              return {
                id: event.id,
                guildId: event.guildId,
                channelId: event.channelId,
                creatorId: event.creatorId,
                name: event.name,
                description: event.description,
                scheduledStartTimestamp: event.scheduledStartTimestamp,
                scheduledEndTimestamp: event.scheduledEndTimestamp,
                privacyLevel: event.privacyLevel,
                status: event.status,
                entityType: event.entityType,
                entityId: event.entityId,
                entityMetadata: event.entityMetadata,
                userCount: event.userCount,
                image: event.image,
                createdTimestamp: event.createdTimestamp,
                url: event.url,
                creator: event.creator ? {
                  id: event.creator.id,
                  username: event.creator.username,
                  discriminator: event.creator.discriminator,
                  avatar: event.creator.avatar,
                  bot: event.creator.bot,
                } : null,
                interestedUsers: interestedUserIds,
                interestedUsersCount: interestedUserIds.length,
              };
            })
          );

          data.success = true;
          data.count = eventsArray.length;
          data.events = eventsArray;
        } catch (error: any) {
          throw new Error(
            `Failed to get guild scheduled events: ${error.message}`
          );
        }
        break;

      case ActionEventType.UPDATE_GUILD_SCHEDULED_EVENT:
        const updateEventGuildId = this.actionInstance.getNodeParameter(
          "guildId",
          0
        ) as string;
        const updateEventId = this.actionInstance.getNodeParameter(
          "guildScheduledEventId",
          0
        ) as string;
        const eventUpdateFields = this.actionInstance.getNodeParameter(
          "eventUpdateFields",
          0,
          {}
        ) as IDataObject;

        try {
          const updateEventGuild = await this.client.guilds.fetch(updateEventGuildId);
          const eventToUpdate = await updateEventGuild.scheduledEvents.fetch(updateEventId);

          if (!eventToUpdate) {
            throw new Error("Guild scheduled event not found.");
          }

          const updateEventData: any = {};

          if (eventUpdateFields.name) {
            updateEventData.name = eventUpdateFields.name as string;
          }
          if (eventUpdateFields.description !== undefined) {
            updateEventData.description = eventUpdateFields.description as string;
          }
          if (eventUpdateFields.scheduledStartTime) {
            updateEventData.scheduledStartTime = new Date(eventUpdateFields.scheduledStartTime as string);
          }
          if (eventUpdateFields.scheduledEndTime) {
            updateEventData.scheduledEndTime = new Date(eventUpdateFields.scheduledEndTime as string);
          }
          if (eventUpdateFields.channelId) {
            updateEventData.channel = eventUpdateFields.channelId as string;
          }
          if (eventUpdateFields.entityType !== undefined) {
            updateEventData.entityType = eventUpdateFields.entityType as number;
          }
          if (eventUpdateFields.status !== undefined) {
            updateEventData.status = eventUpdateFields.status as number;
          }
          if (eventUpdateFields.entityMetadataLocation) {
            updateEventData.entityMetadata = {
              location: eventUpdateFields.entityMetadataLocation as string,
            };
          }
          if (eventUpdateFields.image) {
            updateEventData.image = eventUpdateFields.image as string;
          }

          await eventToUpdate.edit(updateEventData);

          data.success = true;
          data.message = "Guild scheduled event updated successfully.";
          data.eventId = eventToUpdate.id;
        } catch (error: any) {
          throw new Error(
            `Failed to update guild scheduled event: ${error.message}`
          );
        }
        break;

      case ActionEventType.DELETE_GUILD_SCHEDULED_EVENT:
        const deleteEventGuildId = this.actionInstance.getNodeParameter(
          "guildId",
          0
        ) as string;
        const deleteEventId = this.actionInstance.getNodeParameter(
          "guildScheduledEventId",
          0
        ) as string;

        try {
          const deleteEventGuild = await this.client.guilds.fetch(deleteEventGuildId);
          const eventToDelete = await deleteEventGuild.scheduledEvents.fetch(deleteEventId);

          if (!eventToDelete) {
            throw new Error("Guild scheduled event not found.");
          }

          await eventToDelete.delete();

          data.success = true;
          data.message = "Guild scheduled event deleted successfully.";
          data.deletedEventId = deleteEventId;
        } catch (error: any) {
          throw new Error(
            `Failed to delete guild scheduled event: ${error.message}`
          );
        }
        break;

      // Channel Actions
      case ActionEventType.CREATE_CHANNEL:
        const createGuildId = this.actionInstance.getNodeParameter(
          "channelGuildId",
          0
        ) as string;
        const channelName = this.actionInstance.getNodeParameter(
          "channelName",
          0
        ) as string;
        const channelType = this.actionInstance.getNodeParameter(
          "channelType",
          0
        ) as number;
        const createChannelOptions = this.actionInstance.getNodeParameter(
          "channelOptions",
          0,
          {}
        ) as IDataObject;
        const createPermissionOverwrites = this.actionInstance.getNodeParameter(
          "permissionOverwrites",
          0,
          { permission: [] }
        ) as { permission: any[] };
        const createPermissionAdd = this.actionInstance.getNodeParameter(
          "permissionAdd",
          0,
          { permission: [] }
        ) as { permission: any[] };

        try {
          const createGuild = await this.client.guilds.fetch(createGuildId);

          const channelCreateOptions: any = {
            name: channelName,
            type: channelType,
          };

          // Add optional fields if provided
          if (createChannelOptions.topic) {
            channelCreateOptions.topic = createChannelOptions.topic as string;
          }
          if (createChannelOptions.position !== undefined) {
            channelCreateOptions.position = createChannelOptions.position as number;
          }
          if (createChannelOptions.nsfw !== undefined) {
            channelCreateOptions.nsfw = createChannelOptions.nsfw as boolean;
          }
          if (createChannelOptions.bitrate) {
            channelCreateOptions.bitrate = createChannelOptions.bitrate as number;
          }
          if (createChannelOptions.userLimit !== undefined) {
            channelCreateOptions.userLimit = createChannelOptions.userLimit as number;
          }
          if (createChannelOptions.rateLimitPerUser !== undefined) {
            channelCreateOptions.rateLimitPerUser = createChannelOptions.rateLimitPerUser as number;
          }
          if (createChannelOptions.parent) {
            channelCreateOptions.parent = createChannelOptions.parent as string;
          }

          // Prepare permission overwrites array
          let finalPermissionOverwrites: any[] = [];

          // Handle inherit parent permissions
          if (createChannelOptions.inheritParentPermissions === true && createChannelOptions.parent) {
            const parentChannel = await this.client.channels.fetch(createChannelOptions.parent as string);
            if (parentChannel && !parentChannel.isDMBased()) {
              const parentGuildChannel = parentChannel as any;
              if (parentGuildChannel.permissionOverwrites) {
                finalPermissionOverwrites = Array.from(
                  parentGuildChannel.permissionOverwrites.cache.values()
                ).map((overwrite: any) => ({
                  id: overwrite.id,
                  type: overwrite.type,
                  allow: overwrite.allow.bitfield,
                  deny: overwrite.deny.bitfield,
                }));
              }
            }
          }

          // Process permission overwrites (will replace inherited permissions if both are set)
          if (createPermissionOverwrites.permission && createPermissionOverwrites.permission.length > 0) {
            finalPermissionOverwrites = createPermissionOverwrites.permission.map((perm: any) => {
              const overwrite: any = {
                id: perm.id,
                type: perm.type === "role" ? 0 : 1,
              };

              // Convert permission names to PermissionsBitField flags
              if (perm.allow && perm.allow.length > 0) {
                overwrite.allow = perm.allow.map((p: string) => PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags]);
              }

              if (perm.deny && perm.deny.length > 0) {
                overwrite.deny = perm.deny.map((p: string) => PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags]);
              }

              return overwrite;
            });
          }

          // Handle permission add - add to existing overwrites
          if (createPermissionAdd.permission && createPermissionAdd.permission.length > 0) {
            for (const perm of createPermissionAdd.permission) {
              // Find if this target already has an overwrite
              const existingIndex = finalPermissionOverwrites.findIndex(ow => ow.id === perm.id);

              if (existingIndex >= 0) {
                // Target already exists, merge permissions
                const existing = finalPermissionOverwrites[existingIndex];

                // Get current bitfields
                let currentAllow = typeof existing.allow === 'bigint' ? existing.allow : BigInt(0);
                let currentDeny = typeof existing.deny === 'bigint' ? existing.deny : BigInt(0);

                // If allow/deny is array, convert to bitfield
                if (Array.isArray(existing.allow)) {
                  currentAllow = existing.allow.reduce((acc: bigint, flag: bigint) => acc | flag, BigInt(0));
                }
                if (Array.isArray(existing.deny)) {
                  currentDeny = existing.deny.reduce((acc: bigint, flag: bigint) => acc | flag, BigInt(0));
                }

                // Add new permissions
                if (perm.allow && perm.allow.length > 0) {
                  for (const p of perm.allow) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    currentAllow |= flag;
                  }
                }

                if (perm.deny && perm.deny.length > 0) {
                  for (const p of perm.deny) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    currentDeny |= flag;
                  }
                }

                finalPermissionOverwrites[existingIndex] = {
                  id: perm.id,
                  type: perm.type === "role" ? 0 : 1,
                  allow: currentAllow,
                  deny: currentDeny,
                };
              } else {
                // New target, create new overwrite
                let allowBitfield = BigInt(0);
                let denyBitfield = BigInt(0);

                if (perm.allow && perm.allow.length > 0) {
                  for (const p of perm.allow) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    allowBitfield |= flag;
                  }
                }

                if (perm.deny && perm.deny.length > 0) {
                  for (const p of perm.deny) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    denyBitfield |= flag;
                  }
                }

                finalPermissionOverwrites.push({
                  id: perm.id,
                  type: perm.type === "role" ? 0 : 1,
                  allow: allowBitfield,
                  deny: denyBitfield,
                });
              }
            }
          }

          // Set final permission overwrites
          if (finalPermissionOverwrites.length > 0) {
            channelCreateOptions.permissionOverwrites = finalPermissionOverwrites;
          }

          const createdChannel = await createGuild.channels.create(channelCreateOptions);

          data.success = true;
          data.message = "Channel created successfully.";
          data.channelId = createdChannel.id;
          data.channelName = createdChannel.name;
          data.channelType = createdChannel.type;
        } catch (error: any) {
          throw new Error(`Failed to create channel: ${error.message}`);
        }
        break;

      case ActionEventType.DELETE_CHANNEL:
        const deleteChannelTargetId = this.actionInstance.getNodeParameter(
          "targetChannelId",
          0
        ) as string;

        try {
          const channelToDelete = await this.client.channels.fetch(deleteChannelTargetId);

          if (!channelToDelete) {
            throw new Error("Channel not found.");
          }

          if (!channelToDelete.isDMBased()) {
            await channelToDelete.delete();
            data.success = true;
            data.message = "Channel deleted successfully.";
            data.channelId = deleteChannelTargetId;
          } else {
            throw new Error("Cannot delete DM channels.");
          }
        } catch (error: any) {
          throw new Error(`Failed to delete channel: ${error.message}`);
        }
        break;

      case ActionEventType.UPDATE_CHANNEL:
        const updateChannelTargetId = this.actionInstance.getNodeParameter(
          "targetChannelId",
          0
        ) as string;
        const updateChannelOptions = this.actionInstance.getNodeParameter(
          "channelOptions",
          0,
          {}
        ) as IDataObject;
        const updatePermissionOverwrites = this.actionInstance.getNodeParameter(
          "permissionOverwrites",
          0,
          { permission: [] }
        ) as { permission: any[] };
        const updatePermissionAdd = this.actionInstance.getNodeParameter(
          "permissionAdd",
          0,
          { permission: [] }
        ) as { permission: any[] };
        const updatePermissionRemove = this.actionInstance.getNodeParameter(
          "permissionRemove",
          0,
          { permission: [] }
        ) as { permission: any[] };

        try {
          const channelToUpdate = await this.client.channels.fetch(updateChannelTargetId);

          if (!channelToUpdate) {
            throw new Error("Channel not found.");
          }

          if (channelToUpdate.isDMBased()) {
            throw new Error("Cannot update DM channels.");
          }

          const guildChannel = channelToUpdate as any;
          const editOptions: any = {};

          // Add fields to update if provided
          if (updateChannelOptions.topic !== undefined) {
            editOptions.topic = updateChannelOptions.topic as string;
          }
          if (updateChannelOptions.position !== undefined) {
            editOptions.position = updateChannelOptions.position as number;
          }
          if (updateChannelOptions.nsfw !== undefined) {
            editOptions.nsfw = updateChannelOptions.nsfw as boolean;
          }
          if (updateChannelOptions.bitrate !== undefined) {
            editOptions.bitrate = updateChannelOptions.bitrate as number;
          }
          if (updateChannelOptions.userLimit !== undefined) {
            editOptions.userLimit = updateChannelOptions.userLimit as number;
          }
          if (updateChannelOptions.rateLimitPerUser !== undefined) {
            editOptions.rateLimitPerUser = updateChannelOptions.rateLimitPerUser as number;
          }
          if (updateChannelOptions.parent !== undefined) {
            editOptions.parent = updateChannelOptions.parent as string;
          }

          // Prepare permission overwrites
          let finalPermissionOverwrites: any[] | undefined;
          let shouldUpdatePermissions = false;

          // Handle inherit parent permissions for UPDATE
          if (updateChannelOptions.inheritParentPermissions === true && updateChannelOptions.parent) {
            const parentChannel = await this.client.channels.fetch(updateChannelOptions.parent as string);
            if (parentChannel && !parentChannel.isDMBased()) {
              const parentGuildChannel = parentChannel as any;
              if (parentGuildChannel.permissionOverwrites) {
                finalPermissionOverwrites = Array.from(
                  parentGuildChannel.permissionOverwrites.cache.values()
                ).map((overwrite: any) => ({
                  id: overwrite.id,
                  type: overwrite.type,
                  allow: overwrite.allow.bitfield,
                  deny: overwrite.deny.bitfield,
                }));
                shouldUpdatePermissions = true;
              }
            }
          }

          // Process permission overwrites (complete replacement)
          if (updatePermissionOverwrites.permission && updatePermissionOverwrites.permission.length > 0) {
            finalPermissionOverwrites = updatePermissionOverwrites.permission.map((perm: any) => {
              const overwrite: any = {
                id: perm.id,
                type: perm.type === "role" ? 0 : 1,
              };

              // Convert permission names to PermissionsBitField flags
              if (perm.allow && perm.allow.length > 0) {
                overwrite.allow = perm.allow.map((p: string) => PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags]);
              }

              if (perm.deny && perm.deny.length > 0) {
                overwrite.deny = perm.deny.map((p: string) => PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags]);
              }

              return overwrite;
            });
            shouldUpdatePermissions = true;
          }

          // Handle permission add - merge with existing
          if (updatePermissionAdd.permission && updatePermissionAdd.permission.length > 0) {
            // Get current overwrites if we haven't set finalPermissionOverwrites yet
            if (!finalPermissionOverwrites) {
              finalPermissionOverwrites = Array.from(
                guildChannel.permissionOverwrites.cache.values()
              ).map((overwrite: any) => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.bitfield,
                deny: overwrite.deny.bitfield,
              }));
            }

            for (const perm of updatePermissionAdd.permission) {
              // Find if this target already has an overwrite
              const existingIndex = finalPermissionOverwrites.findIndex(ow => ow.id === perm.id);

              if (existingIndex >= 0) {
                // Target already exists, merge permissions
                const existing = finalPermissionOverwrites[existingIndex];

                // Get current bitfields
                let currentAllow = typeof existing.allow === 'bigint' ? existing.allow : BigInt(0);
                let currentDeny = typeof existing.deny === 'bigint' ? existing.deny : BigInt(0);

                // If allow/deny is array, convert to bitfield
                if (Array.isArray(existing.allow)) {
                  currentAllow = existing.allow.reduce((acc: bigint, flag: bigint) => acc | flag, BigInt(0));
                }
                if (Array.isArray(existing.deny)) {
                  currentDeny = existing.deny.reduce((acc: bigint, flag: bigint) => acc | flag, BigInt(0));
                }

                // Add new permissions
                if (perm.allow && perm.allow.length > 0) {
                  for (const p of perm.allow) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    currentAllow |= flag;
                  }
                }

                if (perm.deny && perm.deny.length > 0) {
                  for (const p of perm.deny) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    currentDeny |= flag;
                  }
                }

                finalPermissionOverwrites[existingIndex] = {
                  id: perm.id,
                  type: perm.type === "role" ? 0 : 1,
                  allow: currentAllow,
                  deny: currentDeny,
                };
              } else {
                // New target, create new overwrite
                let allowBitfield = BigInt(0);
                let denyBitfield = BigInt(0);

                if (perm.allow && perm.allow.length > 0) {
                  for (const p of perm.allow) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    allowBitfield |= flag;
                  }
                }

                if (perm.deny && perm.deny.length > 0) {
                  for (const p of perm.deny) {
                    const flag = PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags];
                    denyBitfield |= flag;
                  }
                }

                finalPermissionOverwrites.push({
                  id: perm.id,
                  type: perm.type === "role" ? 0 : 1,
                  allow: allowBitfield,
                  deny: denyBitfield,
                });
              }
            }
            shouldUpdatePermissions = true;
          }

          // Handle permission remove - remove specific targets
          if (updatePermissionRemove.permission && updatePermissionRemove.permission.length > 0) {
            // Get current overwrites if we haven't set finalPermissionOverwrites yet
            if (!finalPermissionOverwrites) {
              finalPermissionOverwrites = Array.from(
                guildChannel.permissionOverwrites.cache.values()
              ).map((overwrite: any) => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.bitfield,
                deny: overwrite.deny.bitfield,
              }));
            }

            // Remove specified targets
            for (const perm of updatePermissionRemove.permission) {
              finalPermissionOverwrites = finalPermissionOverwrites.filter(ow => ow.id !== perm.id);
            }
            shouldUpdatePermissions = true;
          }

          // Set final permission overwrites if any permission operation was performed
          if (shouldUpdatePermissions && finalPermissionOverwrites) {
            editOptions.permissionOverwrites = finalPermissionOverwrites;
          }

          // Perform the update
          await channelToUpdate.edit(editOptions);

          data.success = true;
          data.message = "Channel updated successfully.";
          data.channelId = channelToUpdate.id;
        } catch (error: any) {
          throw new Error(`Failed to update channel: ${error.message}`);
        }
        break;

      case ActionEventType.GET_CHANNEL:
        const getChannelTargetId = this.actionInstance.getNodeParameter(
          "targetChannelId",
          0
        ) as string;

        try {
          const fetchedChannel = await this.client.channels.fetch(getChannelTargetId);

          if (!fetchedChannel) {
            throw new Error("Channel not found.");
          }

          data.success = true;
          data.channel = {
            id: fetchedChannel.id,
            type: fetchedChannel.type,
            createdTimestamp: fetchedChannel.createdTimestamp,
          };

          // Add additional properties for guild channels
          if (!fetchedChannel.isDMBased()) {
            const guildChannel = fetchedChannel as any;
            data.channel = {
              ...data.channel,
              name: guildChannel.name,
              position: guildChannel.position,
              parentId: guildChannel.parentId,
              guildId: guildChannel.guildId,
            };

            // Add text channel specific properties
            if (guildChannel.topic !== undefined) {
              (data.channel as any).topic = guildChannel.topic;
            }
            if (guildChannel.nsfw !== undefined) {
              (data.channel as any).nsfw = guildChannel.nsfw;
            }
            if (guildChannel.rateLimitPerUser !== undefined) {
              (data.channel as any).rateLimitPerUser = guildChannel.rateLimitPerUser;
            }
            // Add voice channel specific properties
            if (guildChannel.bitrate !== undefined) {
              (data.channel as any).bitrate = guildChannel.bitrate;
            }
            if (guildChannel.userLimit !== undefined) {
              (data.channel as any).userLimit = guildChannel.userLimit;
            }
          }
        } catch (error: any) {
          throw new Error(`Failed to get channel: ${error.message}`);
        }
        break;

      case ActionEventType.GET_MANY_CHANNELS:
        const getManyGuildId = this.actionInstance.getNodeParameter(
          "channelGuildId",
          0
        ) as string;
        const limit = this.actionInstance.getNodeParameter(
          "limit",
          0,
          50
        ) as number;
        const channelFilter = this.actionInstance.getNodeParameter(
          "channelFilter",
          0,
          {}
        ) as IDataObject;

        try {
          const getManyGuild = await this.client.guilds.fetch(getManyGuildId);
          let channels = await getManyGuild.channels.fetch();

          // Apply filters
          if (channelFilter.type !== undefined && channelFilter.type !== "") {
            const filterType = channelFilter.type as number;
            channels = channels.filter(channel => channel?.type === filterType);
          }

          if (channelFilter.nameContains) {
            const nameFilter = (channelFilter.nameContains as string).toLowerCase();
            channels = channels.filter(channel =>
              channel?.name?.toLowerCase().includes(nameFilter)
            );
          }

          // Convert to array and apply limit
          let channelsArray = Array.from(channels.values());

          if (limit > 0) {
            channelsArray = channelsArray.slice(0, limit);
          }

          // Map to clean data
          const channelsData = channelsArray.map(channel => {
            if (!channel) return null;

            const baseData: any = {
              id: channel.id,
              type: channel.type,
              createdTimestamp: channel.createdTimestamp,
            };

            if (!channel.isDMBased()) {
              const guildChannel = channel as any;
              baseData.name = guildChannel.name;
              baseData.position = guildChannel.position;
              baseData.parentId = guildChannel.parentId;
              baseData.guildId = guildChannel.guildId;

              if (guildChannel.topic !== undefined) {
                baseData.topic = guildChannel.topic;
              }
              if (guildChannel.nsfw !== undefined) {
                baseData.nsfw = guildChannel.nsfw;
              }
              if (guildChannel.rateLimitPerUser !== undefined) {
                baseData.rateLimitPerUser = guildChannel.rateLimitPerUser;
              }
              if (guildChannel.bitrate !== undefined) {
                baseData.bitrate = guildChannel.bitrate;
              }
              if (guildChannel.userLimit !== undefined) {
                baseData.userLimit = guildChannel.userLimit;
              }
            }

            return baseData;
          }).filter(channel => channel !== null);

          data.success = true;
          data.channels = channelsData;
          data.count = channelsData.length;
        } catch (error: any) {
          throw new Error(`Failed to get channels: ${error.message}`);
        }
        break;

      default:
        throw new Error(`Action "${action}" is not supported.`);
    }

    return data;
  }
}
