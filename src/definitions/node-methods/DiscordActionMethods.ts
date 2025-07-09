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
        scheduledEvent: [
          {
            name: "Guild Scheduled Event Update",
            value: ActionEventType.GUILD_SCHEDULED_EVENT_UPDATE,
          },
        ],
      };

      return actionOptions[type] || [];
    },
  },
};
