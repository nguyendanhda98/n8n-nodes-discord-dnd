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
            name: "Create Event",
            value: ActionEventType.CREATE_GUILD_SCHEDULED_EVENT,
          },
          {
            name: "Get Event",
            value: ActionEventType.GET_GUILD_SCHEDULED_EVENT,
          },
          {
            name: "Get Many Events",
            value: ActionEventType.GET_MANY_GUILD_SCHEDULED_EVENTS,
          },
          {
            name: "Update Event",
            value: ActionEventType.UPDATE_GUILD_SCHEDULED_EVENT,
          },
          {
            name: "Delete Event",
            value: ActionEventType.DELETE_GUILD_SCHEDULED_EVENT,
          },
          {
            name: "Guild Scheduled Event Update (Legacy)",
            value: ActionEventType.GUILD_SCHEDULED_EVENT_UPDATE,
          },
        ],
        channel: [
          { name: "Create Channel", value: ActionEventType.CREATE_CHANNEL },
          { name: "Delete Channel", value: ActionEventType.DELETE_CHANNEL },
          { name: "Update Channel", value: ActionEventType.UPDATE_CHANNEL },
          { name: "Get Channel", value: ActionEventType.GET_CHANNEL },
          { name: "Get Many Channels", value: ActionEventType.GET_MANY_CHANNELS },
        ],
      };

      return actionOptions[type] || [];
    },
  },
};
