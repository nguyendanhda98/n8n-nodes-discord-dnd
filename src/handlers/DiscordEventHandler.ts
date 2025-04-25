import { Client } from "discord.js";
import { ITriggerFunctions, IDataObject } from "n8n-workflow";
import {
  messageToJson,
  fetchReferencedMessage,
} from "../transformers/MessageTransformer";

export class DiscordEventHandler {
  constructor(
    private readonly client: Client,
    private readonly triggerInstance: ITriggerFunctions
  ) {}

  setupEventHandler(event: string) {
    // Log bot status
    this.setupStatusLogging();

    // Handle main events
    this.client.on(event, async (...args: any[]) => {
      const data: IDataObject = {};

      // Helper to enrich user/member info with roles
      const enrichMember = async (memberOrUser: any, guildId?: string) => {
        if (!memberOrUser) return null;

        const guild = guildId ? this.client.guilds.cache.get(guildId) : null;
        const member = guild
          ? await guild.members.fetch(memberOrUser.id).catch(() => null)
          : null;

        return {
          ...memberOrUser,
          roles:
            member?.roles.cache.map((role) => ({
              id: role.id,
              name: role.name,
              color: role.color,
              position: role.position,
            })) || [],
        };
      };

      switch (event) {
        case "messageCreate":
        case "messageUpdate":
        case "messageDelete":
          const message = args[0];
          const messageData = messageToJson(message);
          data.message = messageData;
          
          // Use the guild ID from the message when enriching the author
          if (message.author && message.guildId) {
            data.user = await enrichMember(message.author, message.guildId);
          } else {
            data.user = message.author;
          }

          if (message.reference && messageData.mentions?.repliedMessage) {
            const referencedContent = await fetchReferencedMessage(message);
            if (referencedContent) {
              messageData.mentions.repliedMessage.content = referencedContent;
            }
          }
          break;

        case "guildMemberAdd":
        case "guildMemberRemove":
        case "guildMemberUpdate":
          const member = args[0];
          data.member = await enrichMember(member, member.guild.id);
          break;

        default:
          data.eventData = args;
          
          // Try to extract user/member and guild info from the first argument
          const firstArg = args[0];
          if (firstArg) {
            if (firstArg.author && firstArg.guildId) {
              // Message-like object
              data.user = await enrichMember(firstArg.author, firstArg.guildId);
            } else if (firstArg.user && firstArg.guild) {
              // Member-like object
              data.user = await enrichMember(firstArg.user, firstArg.guild.id);
            } else if (firstArg.id) {
              // User-like object, try to find in guilds
              const guilds = this.client.guilds.cache;
              let enrichedUser = null;
              
              // Try to find user in any guild the bot is in
              for (const [, guild] of guilds) {
                try {
                  const member = await guild.members.fetch(firstArg.id);
                  if (member) {
                    enrichedUser = await enrichMember(firstArg, guild.id);
                    break;
                  }
                } catch {
                  // Ignore errors, just try next guild
                }
              }
              
              data.user = enrichedUser || firstArg;
            }
          }
      }

      this.triggerInstance.emit([
        this.triggerInstance.helpers.returnJsonArray([data]),
      ]);
    });
  }

  private setupStatusLogging() {
    this.client.on("ready", () => {
      console.log("Bot đã sẵn sàng! Đang chờ tin nhắn...");
    });

    this.client.on("debug", (info) => {
      console.log("Debug Discord.js:", info);
    });

    this.client.on("error", (error) => {
      console.error("Lỗi Discord.js:", error);
    });
  }
}
