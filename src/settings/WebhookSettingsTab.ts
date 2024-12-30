import { App, PluginSettingTab, Setting } from 'obsidian';
import PostWebhookPlugin from '../main';
import { WebhookItem } from './components/WebhookItem';
import { Webhook } from '../types';

export class WebhookSettingsTab extends PluginSettingTab {
  plugin: PostWebhookPlugin;

  constructor(app: App, plugin: PostWebhookPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    this.displayWebhooks();
    this.displayAddWebhookButton();
  }

  private displayWebhooks(): void {
    this.plugin.settings.webhooks.forEach((webhook, index) => {
      const webhookContainer = this.containerEl.createDiv();
      webhookContainer.addClass('webhook-container');

      new WebhookItem(
        webhookContainer,
        webhook,
        index,
        this.updateWebhook.bind(this),
        this.removeWebhook.bind(this)
      );

      // Add separator after each webhook
      webhookContainer.createEl('hr');
    });
  }

  private displayAddWebhookButton(): void {
    new Setting(this.containerEl)
      .addButton(button => button
        .setButtonText('Add Webhook')
        .onClick(async () => {
          this.plugin.settings.webhooks.push({
            id: crypto.randomUUID(),
            name: 'New Webhook',
            url: '',
            attachResponse: false,
            excludeAttachments: false,
            includeVariableNote: false
          });
          await this.plugin.saveSettings();
          this.display();
        }));
  }

  private async updateWebhook(index: number, updates: Partial<Webhook>): Promise<void> {
    this.plugin.settings.webhooks[index] = {
      ...this.plugin.settings.webhooks[index],
      ...updates
    };
    await this.plugin.saveSettings();
  }

  private async removeWebhook(index: number): Promise<void> {
    this.plugin.settings.webhooks.splice(index, 1);
    await this.plugin.saveSettings();
    this.display();
  }
}