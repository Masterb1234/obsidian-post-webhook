import { Plugin } from 'obsidian';
import { WebhookSettingsTab } from './settings/WebhookSettingsTab';
import { WebhookCommands } from './commands/WebhookCommands';
import { WebhookSettings } from './types';

const DEFAULT_SETTINGS: WebhookSettings = {
  webhooks: [{
    id: 'default',
    name: 'Default Webhook',
    url: '',
    attachResponse: false
  }],
  includeVariableNote: false
};

export default class PostWebhookPlugin extends Plugin {
  settings: WebhookSettings;
  webhookCommands: WebhookCommands;

  async onload() {
    await this.loadSettings();
    
    this.webhookCommands = new WebhookCommands(this);
    this.webhookCommands.registerCommands();
    
    this.addSettingTab(new WebhookSettingsTab(this.app, this));
  }

  onunload() {
    this.webhookCommands?.selectionCache?.destroy();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.webhookCommands?.registerCommands();
  }
}