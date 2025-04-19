import {
  INodeType,
  ITriggerFunctions,
  ITriggerResponse,
  ICredentialDataDecryptedObject,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';
import { initializeDiscordClient } from './client';
import { setupMessageEventHandler } from './event-handlers';
import { nodeDescription } from './node-description';
import { ITriggerParameters } from './types';
import { Client } from 'discord.js';

/**
 * Discord Trigger node for n8n
 * This is the main entry point for the node
 */
export class DiscordTrigger implements INodeType {
  description = nodeDescription;

  methods = {
    loadOptions: {
      async getServers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('discordApi') as ICredentialDataDecryptedObject;
        const client = await initializeDiscordClient(credentials.botToken as string);
        
        // Wait for client to be ready
        await new Promise<void>((resolve) => {
          if (client.isReady()) resolve();
          else client.once('ready', () => resolve());
        });

        const servers = client.guilds.cache.map(guild => ({
          name: guild.name,
          value: guild.id,
          description: `Server ID: ${guild.id}`,
        }));

        // Clean up client
        client.destroy();

        return servers;
      },
    },
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = await this.getCredentials('discordApi') as ICredentialDataDecryptedObject;
    
    // Extract parameters from node configuration
    const parameters: ITriggerParameters = {
      // Get core parameters
      triggerType: this.getNodeParameter('triggerType', 'messageContent') as string,
      includeBotMessages: this.getNodeParameter('includeBotMessages', false) as boolean,
      
      // Get filter parameters
      filterByServers: this.getNodeParameter('filterByServers', false) as boolean,
      serverIds: [],
      filterByChannels: this.getNodeParameter('filterByChannels', false) as boolean,
      channelIds: [],
      filterByRoles: this.getNodeParameter('filterByRoles', false) as boolean,
      roleIds: [],
    };

    // Process server filter parameters
    if (parameters.filterByServers) {
      parameters.serverFilterMethod = this.getNodeParameter('serverFilterMethod', 'fromList') as 'fromList' | 'byUrl' | 'byId';
      
      switch (parameters.serverFilterMethod) {
        case 'fromList':
          parameters.serverIds = this.getNodeParameter('serverIds', []) as string[];
          break;
        case 'byUrl':
          const url = this.getNodeParameter('serverUrl', '') as string;
          const serverIdFromUrl = url.split('/').pop();
          if (serverIdFromUrl) {
            parameters.serverIds = [serverIdFromUrl];
          }
          break;
        case 'byId':
          const serverId = this.getNodeParameter('serverId', '') as string;
          if (serverId) {
            parameters.serverIds = [serverId];
          }
          break;
      }
    }
    
    if (parameters.filterByChannels) {
      parameters.channelIds = (this.getNodeParameter('channelIds', '') as string)
        .split(',')
        .map(id => id.trim());
    }
    
    if (parameters.filterByRoles) {
      parameters.roleIds = (this.getNodeParameter('roleIds', '') as string)
        .split(',')
        .map(id => id.trim());
    }

    // Get trigger-specific parameters
    if (parameters.triggerType === 'messageContent') {
      parameters.matchPattern = this.getNodeParameter('matchPattern', '') as string;
      
      if (['contains', 'endsWith', 'equals', 'startsWith'].includes(parameters.matchPattern)) {
        parameters.matchValue = this.getNodeParameter('matchValue', '') as string;
        parameters.caseSensitive = this.getNodeParameter('caseSensitive', false) as boolean;
      } else if (parameters.matchPattern === 'regex') {
        parameters.regexPattern = this.getNodeParameter('regexPattern', '') as string;
      }
    } else if (parameters.triggerType === 'botInteraction') {
      parameters.interactionType = this.getNodeParameter('interactionType', 'botMentioned') as string;
    }

    // Initialize Discord client and set up event handlers
    const client = await initializeDiscordClient(credentials.botToken as string);

    // Set up response data with manual trigger function
    const responseData: ITriggerResponse = {
      manualTriggerFunction: async () => {
        // This function will be executed when the workflow is manually triggered
        // Don't need to do anything here as we only want the workflow to be triggered by Discord events
        return;
      },
    };

    // Set up message event handler
    setupMessageEventHandler(client, this, parameters);

    // Function to clean up when node is deactivated
    const closeFunction = async () => {
      console.log('Disconnecting from Discord...');
      client.destroy();
    };

    return {
      ...responseData,
      closeFunction,
    };
  }
}