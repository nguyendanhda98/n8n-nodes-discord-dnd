import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { ActionEventType } from "../../Interfaces/types";

export const DiscordActionMethods = {
  loadOptions: {
    async sendActions(
      this: ILoadOptionsFunctions
    ): Promise<INodePropertyOptions[]> {
      const type = this.getCurrentNodeParameter("actionType") as string;

      const actionOptions: { [key: string]: INodePropertyOptions[] } = {
        message: [
          { name: "Send Typing", value: ActionEventType.SEND_TYPING },
          { name: "Send Message", value: ActionEventType.SEND_MESSAGE },
          { name: "Delete Message", value: ActionEventType.DELETE_MESSAGE },
          { name: "Edit Message", value: ActionEventType.EDIT_MESSAGE },
          { name: "React To Message", value: ActionEventType.REACT_TO_MESSAGE },
          { name: "Remove Reaction", value: ActionEventType.REMOVE_REACTION },
          { name: "Pin Message", value: ActionEventType.PIN_MESSAGE },
          { name: "Unpin Message", value: ActionEventType.UNPIN_MESSAGE },
        ],
        channel: [
          // Add channel related actions here in the future
        ],
        role: [
          // Add role related actions here in the future
        ],
        member: [
          // Add member related actions here in the future
        ],
      };

      return actionOptions[type] || [];
    },
  },
};
