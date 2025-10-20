import { GatewayIntentBits, ClientOptions, Partials } from "discord.js";

export function getclientOptions(triggerType: string): ClientOptions {
  let intents: GatewayIntentBits[] = [];
  let partials: Partials[] = [];
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
      partials = [
        Partials.User,
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
      ];
      break;

    case "guild":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers];
      partials = [Partials.GuildMember];
      break;

    case "moderation":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers,
      ];
      partials = [Partials.GuildMember];
      break;

    case "emojiSticker":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildExpressions];
      partials = [];
      break;

    case "integrationWebhook":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
      ];
      partials = [];
      break;

    case "invite":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildInvites];
      partials = [];
      break;

    case "voice":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates];
      partials = [];
      break;

    case "presence":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences];
      partials = [Partials.GuildMember];
      break;

    case "scheduledEvent":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
      ];
      partials = [Partials.GuildScheduledEvent];
      break;

    case "interaction":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildIntegrations];
      partials = [];
      break;

    case "botStatus":
      intents = [];
      partials = [];
      break;

    case "user":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers];
      partials = [Partials.User, Partials.GuildMember];
      break;

    case "autoModeration":
      intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration];
      partials = [];
      break;

    case "poll":
      intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessagePolls,
      ];
      partials = [Partials.Message];
      break;

    case "channel":
      intents = [GatewayIntentBits.Guilds];
      partials = [Partials.Channel];
      break;

    default:
      throw new Error(`Unsupported type: ${triggerType}`);
  }
  return { intents, partials };
}
