const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');
const WebhookService = require('./webhookService');

class PostWebhookPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'send-to-webhook',
            name: 'Send to Webhook',
            callback: async () => {
                const file = this.app.workspace.getActiveFile();
                if (!file) {
                    new Notice('No active file');
                    return;
                }

                if (!this.settings.webhookUrl) {
                    new Notice('Please configure Webhook URL in settings');
                    return;
                }

                try {
                    const content = await this.app.vault.read(file);
                    await WebhookService.sendContent(this.app, this.settings.webhookUrl, content, file.name, file);
                    new Notice('Successfully sent to Webhook');
                } catch (error) {
                    console.error('Webhook error:', error);
                    new Notice(`Error: ${error.message}`);
                }
            }
        });

        this.addSettingTab(new PostWebhookSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, {
            webhookUrl: ''
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class PostWebhookSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Webhook URL')
            .setDesc('Enter the URL where your notes will be sent')
            .addText(text => text
                .setPlaceholder('https://your-webhook-url')
                .setValue(this.plugin.settings.webhookUrl)
                .onChange(async (value) => {
                    this.plugin.settings.webhookUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Test Webhook')
            .setDesc('Send a test request to verify your Webhook configuration')
            .addButton(button => button
                .setButtonText('Test Webhook')
                .onClick(async () => {
                    if (!this.plugin.settings.webhookUrl) {
                        new Notice('Please configure Webhook URL first');
                        return;
                    }

                    try {
                        const testPayload = {
                            test: true,
                            timestamp: Date.now(),
                            message: 'Test Webhook from Obsidian'
                        };

                        const response = await fetch(this.plugin.settings.webhookUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(testPayload)
                        });

                        if (response.ok) {
                            new Notice('Test Webhook sent successfully');
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (error) {
                        new Notice(`Test failed: ${error.message}`);
                    }
                }));
    }
}

module.exports = PostWebhookPlugin;