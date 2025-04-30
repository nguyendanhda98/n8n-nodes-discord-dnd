import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import {
  Client,
  TextChannel,
  DMChannel,
  ThreadChannel,
  ClientOptions,
} from "discord.js";
import { initializeDiscordClient } from "./client";
import { getclientOptions } from "../definitions/DiscordIntentMapping";
import { DiscordActionDescription } from "../definitions/node-description/DiscordActionDescription";
import { DiscordActionMethods } from "../definitions/node-methods/DiscordActionMethods";
import { IActionParameters } from "../Interfaces/types";
import { ActionEventHandler } from "../handlers/action/ActionEventHandler";

export class DiscordActions implements INodeType {
  description = DiscordActionDescription;
  methods = DiscordActionMethods;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("discordApi");
    const parameters: IActionParameters = {
      actionType: this.getNodeParameter("actionType", 0) as string,
      action: this.getNodeParameter("action", 0) as string,
    };

    const clientOptions: ClientOptions = getclientOptions(
      parameters.actionType
    );
    const client = await initializeDiscordClient(
      credentials.botToken as string,
      clientOptions
    );

    const eventHandler = new ActionEventHandler(client, this);
    const result = await eventHandler.setupEventHandler(parameters.action);

    // Close the Discord client connection
    await client.destroy();

    // Return the result data properly formatted for n8n
    return [this.helpers.returnJsonArray([result])];
  }
}
