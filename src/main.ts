import { Plugin } from 'obsidian';
import { WebhookSettingsTab } from './settings/WebhookSettingsTab';
import { WebhookCommands } from './commands/WebhookCommands';
import { WebhookSettings } from './types';

const DEFAULT_SETTINGS: WebhookSettings = {
  webhooks: [{
    id: crypto.randomUUID(),
    name: "Default Webhook",
    url: '',
    enabled: true,
    processInlineFields: false,
    responseHandling: 'append'
  }]
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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    
    // Ensure all webhooks have required properties
    this.settings.webhooks = this.settings.webhooks.map(webhook => ({
      ...webhook,
      // For old webhooks with id 'default' or no id, generate a new UUID
      id: webhook.id === 'default' || !webhook.id ? crypto.randomUUID() : webhook.id,
      enabled: webhook.enabled ?? true,
      processInlineFields: webhook.processInlineFields ?? false,
      responseHandling: webhook.responseHandling || 'append'
    }));
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.webhookCommands?.registerCommands();
  }
}