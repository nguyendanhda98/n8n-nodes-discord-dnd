import {
  INodeType,
  ITriggerFunctions,
  ITriggerResponse,
  ICredentialDataDecryptedObject,
} from "n8n-workflow";
import { initializeDiscordClient } from "./client";
import { DiscordTriggerDescription } from "../definitions/node-description/DiscordTriggerDescription";
import { ITriggerParameters } from "../Interfaces/types";
import { DiscordTriggerMethods } from "../definitions/node-methods/DiscordEventMethods";
import { getclientOptions } from "../definitions/DiscordIntentMapping";
import { TriggerEventHandler } from "../handlers/trigger/TriggerEventHandler";
import { ClientOptions } from "discord.js";

export class DiscordTrigger implements INodeType {
  description = DiscordTriggerDescription;
  methods = DiscordTriggerMethods;

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = (await this.getCredentials(
      "discordApi"
    )) as ICredentialDataDecryptedObject;

    const parameters: ITriggerParameters = {
      triggerType: this.getNodeParameter("triggerType", "message") as string,
      event: this.getNodeParameter("event", "messageCreate") as string,
      includeBot: this.getNodeParameter("includeBot", false) as boolean,
      directMessage: this.getNodeParameter("directMessage", false) as boolean,
    };

    const clientOptions: ClientOptions = getclientOptions(
      parameters.triggerType
    );
    const client = await initializeDiscordClient(
      credentials.botToken as string,
      clientOptions
    );

    const eventHandler = new TriggerEventHandler(client, this);
    await eventHandler.setupEventHandler(parameters.event, parameters.includeBot, parameters.directMessage);

    const closeFunction = async () => {
      console.log("Disconnecting from Discord...");
      client.destroy();
    };

    return {
      manualTriggerFunction: async () => {
        return;
      },
      closeFunction,
    };
  }
}
