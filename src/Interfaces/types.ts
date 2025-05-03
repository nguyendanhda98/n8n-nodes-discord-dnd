export interface ITriggerParameters {
  triggerType: string;
  event: string;
  includeBot?: boolean;
  directMessage?: boolean;
}

export interface IActionParameters {
  actionType: string;
  action: string;
}
