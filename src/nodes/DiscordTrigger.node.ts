import {
  INodeType,
  ITriggerFunctions,
  ITriggerResponse,
  ICredentialDataDecryptedObject,
} from "n8n-workflow";
import { initializeDiscordClient } from "./client";
import { nodeDescription } from "../definitions/node-description";
import { ITriggerParameters } from "../Interfaces/types";
import { methods } from "../definitions/DiscordEventDefinitions";
import { getIntentsForTrigger } from "../definitions/DiscordIntentMapping";
import { DiscordEventHandler } from "../handlers/DiscordEventHandler";

export class DiscordTrigger implements INodeType {
  description = nodeDescription;
  methods = methods;

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = (await this.getCredentials(
      "discordApi"
    )) as ICredentialDataDecryptedObject;

    const parameters: ITriggerParameters = {
      triggerType: this.getNodeParameter("triggerType", "message") as string,
      event: this.getNodeParameter("event", "messageCreate") as string,
    };

    const intents = getIntentsForTrigger(
      parameters.triggerType,
      parameters.event
    );
    const client = await initializeDiscordClient(
      credentials.botToken as string,
      intents
    );

    const eventHandler = new DiscordEventHandler(client, this);
    await eventHandler.setupEventHandler(parameters.event);

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
