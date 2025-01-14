import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
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
    
    containerEl.createEl('h2', { 
      text: 'Webhooks',
      cls: 'mod-top-border'
    });

    const webhooksList = containerEl.createDiv('webhooks-list');
    this.plugin.settings.webhooks.forEach((webhook, index) => {
      const webhookContainer = webhooksList.createDiv('webhook-item');
      webhookContainer.addClass('setting-item');
      
      const info = webhookContainer.createDiv('setting-item-info');
      const title = info.createDiv('setting-item-name');
      title.setText(webhook.name || 'Unnamed Webhook');

      const control = webhookContainer.createDiv('setting-item-control');
      control.style.display = 'flex';
      control.style.alignItems = 'center';
      control.style.gap = '8px';
      
      const settingsButton = control.createEl('button', {
        cls: 'clickable-icon',
        attr: {
          'aria-label': 'Edit webhook settings'
        }
      });
      setIcon(settingsButton, 'settings');
      
      settingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showWebhookDetails(webhook, index);
      });
      
      const powerButton = control.createEl('button', {
        cls: 'clickable-icon',
        attr: {
          'aria-label': webhook.enabled ? 'Disable webhook' : 'Enable webhook'
        }
      });
      setIcon(powerButton, 'power');
      
      if (webhook.enabled === undefined || webhook.enabled) {
        powerButton.addClass('is-enabled');
        powerButton.style.color = 'var(--color-green)';
      } else {
        powerButton.addClass('is-disabled');
      }
      
      powerButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.updateWebhook(index, { enabled: !webhook.enabled });
        // Force re-registration of commands after toggling
        this.plugin.webhookCommands.registerCommands();
      });
      
      webhookContainer.addEventListener('click', () => {
        this.showWebhookDetails(webhook, index);
      });
    });

    new Setting(containerEl)
      .addButton(button => button
        .setButtonText('Add Webhook')
        .onClick(async () => {
          const newWebhook: Webhook = {
            id: crypto.randomUUID(),
            name: 'New Webhook',
            url: '',
            excludeAttachments: false,
            includeVariableNote: false,
            enabled: true,
            processInlineFields: false,
            responseHandling: 'append'
          };
          
          this.plugin.settings.webhooks.push(newWebhook);
          await this.plugin.saveSettings();
          
          // Immediately show the edit modal for the new webhook
          this.showWebhookDetails(newWebhook, this.plugin.settings.webhooks.length - 1);
          
          this.display();
        }));
  }

  private showWebhookDetails(webhook: Webhook, index: number): void {
    const modal = new WebhookItem(
      this.app,
      webhook,
      index,
      this.updateWebhook.bind(this),
      this.removeWebhook.bind(this)
    );
    modal.open();
  }

  private async updateWebhook(index: number, updates: Partial<Webhook>): Promise<void> {
    this.plugin.settings.webhooks[index] = {
      ...this.plugin.settings.webhooks[index],
      ...updates
    };
    await this.plugin.saveSettings();
    this.display();
  }

  private async removeWebhook(index: number): Promise<void> {
    this.plugin.settings.webhooks.splice(index, 1);
    await this.plugin.saveSettings();
    this.display();
  }
}