import { GatewayIntentBits } from "discord.js";

export function getIntentsForTrigger(
  triggerType: string,
  event?: string
): GatewayIntentBits[] {
  let intents: GatewayIntentBits[] = [];
  switch (triggerType) {
    case "message":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageTyping,
      ];
      break;

    case "guild":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers];

      break;

    case "moderation":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers,
      ];
      break;

    case "emojiSticker":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildExpressions];
      break;

    case "integrationWebhook":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
      ];
      break;

    case "invite":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildInvites];
      break;

    case "voice":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates];
      break;

    case "presence":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences];
      break;

    case "scheduledEvent":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
      ];
      break;

    case "interaction":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildIntegrations];
      break;

    case "botStatus":
      intents = []; // No intents needed for bot status events
      break;

    case "user":
      intents =
        event === "userUpdate"
          ? [] // userUpdate doesn't need intents
          : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers];
      break;

    case "autoModeration":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration];
      break;

    case "poll":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessagePolls,
      ];
      break;

    default:
      throw new Error(`Unsupported type: ${triggerType}`);
  }
  return intents;
}
