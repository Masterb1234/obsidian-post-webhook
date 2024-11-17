const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');
const { WebhookService } = require('./webhookService');

class PostWebhookPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        // Register the command for both reading and editing modes
        this.addCommand({
            id: 'send-to-webhook',
            name: 'Send to webhook',
            callback: () => {
                const file = this.app.workspace.getActiveFile();
                if (file) {
                    this.handleSendToWebhook(file);
                } else {
                    new Notice('⚠️ No active file');
                }
            }
        });

        // Add a ribbon icon for easier mobile access
        this.addRibbonIcon('paper-plane', 'Send to webhook', (evt) => {
            const file = this.app.workspace.getActiveFile();
            if (file) {
                this.handleSendToWebhook(file);
            } else {
                new Notice('⚠️ No active file');
            }
        });

        this.addSettingTab(new PostWebhookSettingTab(this.app, this));
    }

    async handleSendToWebhook(file) {
        if (!this.settings.webhookUrl) {
            new Notice('⚠️ Please set a webhook URL in the plugin settings');
            return;
        }

        try {
            new Notice('📤 Sending to webhook...');
            const content = await this.app.vault.read(file);
            await WebhookService.sendContent(
                this.app,
                this.settings.webhookUrl,
                content,
                file.name,
                file.path
            );
            new Notice('✅ Successfully sent to webhook');
        } catch (error) {
            console.error('Webhook error:', error);
            new Notice(`❌ Error: ${error.message}`);
        }
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
        const {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: 'Post Webhook Settings'});

        new Setting(containerEl)
            .setName('Webhook URL')
            .setDesc('Enter the webhook URL where notes will be sent')
            .addText(text => text
                .setPlaceholder('https://your-webhook-url.com/endpoint')
                .setValue(this.plugin.settings.webhookUrl)
                .onChange(async (value) => {
                    this.plugin.settings.webhookUrl = value.trim();
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = PostWebhookPlugin;