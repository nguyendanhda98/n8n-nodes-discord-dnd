import { Client, DMChannel, TextChannel, ThreadChannel } from "discord.js";
import { IDataObject, IExecuteFunctions } from "n8n-workflow";

export class ActionEventHandler {
  constructor(
    private readonly client: Client,
    private readonly actionInstance: IExecuteFunctions
  ) {}

  async setupEventHandler(action: string): Promise<IDataObject> {
    const data: IDataObject = {};

    switch (action) {
      case "sendTyping":
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
      default:
        throw new Error(`Action "${action}" is not supported.`);
    }

    return data;
  }
}
