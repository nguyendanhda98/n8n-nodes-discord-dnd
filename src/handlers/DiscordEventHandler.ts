import { Client } from "discord.js";
import { ITriggerFunctions, IDataObject } from "n8n-workflow";
import { messageToJson, fetchReferencedMessage } from "../transformers/MessageTransformer";

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
        const member = guild ? await guild.members.fetch(memberOrUser.id) : null;
        
        return {
          ...memberOrUser,
          roles: member?.roles.cache.map(role => ({
            id: role.id,
            name: role.name,
            color: role.color,
            position: role.position
          })) || []
        };
      };

      switch (event) {
        case "messageCreate":
        case "messageUpdate":
        case "messageDelete":
          const message = args[0];
          const messageData = messageToJson(message);
          data.message = messageData;
          
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
      }

      this.triggerInstance.emit([this.triggerInstance.helpers.returnJsonArray([data])]);
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