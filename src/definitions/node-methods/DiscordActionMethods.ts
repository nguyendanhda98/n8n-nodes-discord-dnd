import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { Events } from "discord.js";

export const DiscordActionMethods = {
  loadOptions: {
    async sendActions(
      this: ILoadOptionsFunctions
    ): Promise<INodePropertyOptions[]> {
      const type = this.getCurrentNodeParameter("actionType") as string;

      const actionOptions: { [key: string]: INodePropertyOptions[] } = {
        message: [{ name: "Send Typing", value: "sendTyping" }],
      };

      return actionOptions[type] || [];
    },
  },
};
