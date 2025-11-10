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
      "discordApiDnd"
    )) as ICredentialDataDecryptedObject;

    const parameters: ITriggerParameters = {
      triggerType: this.getNodeParameter("triggerType", "message") as string,
      event: this.getNodeParameter("event", "messageCreate") as string,
      includeBot: this.getNodeParameter("includeBot", false) as boolean,
      directMessage: this.getNodeParameter("directMessage", false) as boolean,
    };

    // Get pattern and value parameters for message triggers
    if (parameters.triggerType === "message") {
      parameters.pattern = this.getNodeParameter("pattern", "botMention") as string;
      
      if (["contains", "startsWith", "endsWith", "equals", "regex"].includes(parameters.pattern)) {
        parameters.value = this.getNodeParameter("value", "") as string;
      }
    }
    
    // Get server IDs for scheduled event triggers (required, can be multiple)
    if (parameters.triggerType === "scheduledEvent") {
      const serverIds = this.getNodeParameter("serverId", "") as string;
      if (serverIds) {
        parameters.serverIds = serverIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
      }
    }
    
    // Get additional fields for filtering
    const additionalFields = this.getNodeParameter("additionalFields", {}) as {
      serverIds?: string;
      channelIds?: string;
      roleIds?: string;
      userIds?: string;
    };
    
    // For non-scheduled event types, get serverIds from additionalFields
    if (parameters.triggerType !== "scheduledEvent" && additionalFields.serverIds) {
      parameters.serverIds = additionalFields.serverIds.split(',').map(id => id.trim());
    }
    
    if (additionalFields.channelIds) {
      parameters.channelIds = additionalFields.channelIds.split(',').map(id => id.trim());
    }
    
    if (additionalFields.roleIds) {
      parameters.roleIds = additionalFields.roleIds.split(',').map(id => id.trim());
    }
    
    if (additionalFields.userIds) {
      parameters.userIds = additionalFields.userIds.split(',').map(id => id.trim());
    }

    const clientOptions: ClientOptions = getclientOptions(
      parameters.triggerType
    );
    const client = await initializeDiscordClient(
      credentials.botToken as string,
      clientOptions
    );

    const eventHandler = new TriggerEventHandler(client, this);
    await eventHandler.setupEventHandler(
      parameters.event, 
      parameters.includeBot, 
      parameters.directMessage,
      parameters.pattern,
      parameters.value,
      parameters.serverIds,
      parameters.channelIds,
      parameters.roleIds,
      parameters.userIds
    );

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
