const { Plugin } = require('obsidian');
const WebhookSettingsTab = require('./settings/WebhookSettingsTab');
const WebhookCommands = require('./commands/WebhookCommands');

class PostWebhookPlugin extends Plugin {
    async onload() {
        await this.loadSettings();
        
        // Initialize commands handler
        this.webhookCommands = new WebhookCommands(this);
        this.webhookCommands.registerCommands();
        
        // Add settings tab
        this.addSettingTab(new WebhookSettingsTab(this.app, this));
    }

    onunload() {
        if (this.webhookCommands?.selectionCache) {
            this.webhookCommands.selectionCache.destroy();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, {
            webhooks: [{
                id: 'default',
                name: 'Default Webhook',
                url: '',
                attachResponse: false
            }]
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Re-register commands with updated settings
        if (this.webhookCommands) {
            this.webhookCommands.registerCommands();
        }
    }
}

module.exports = PostWebhookPlugin;