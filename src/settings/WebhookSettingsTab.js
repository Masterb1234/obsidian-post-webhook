const { PluginSettingTab, Setting, Notice, requestUrl } = require('obsidian');

class WebhookSettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        
        const webhooksContainer = containerEl.createDiv('webhooks-container');
        
        this.plugin.settings.webhooks.forEach((webhook, index) => {
            const webhookContainer = webhooksContainer.createDiv('webhook-container');
            webhookContainer.dataset.webhookId = webhook.id;

            if (index > 0) {
                const separator = webhookContainer.createEl('hr');
                separator.style.margin = '1em 0';
                separator.style.border = 'none';
                separator.style.borderTop = '1px solid var(--background-modifier-border)';
            }

            this.createNameSetting(webhook, webhookContainer);
            this.createUrlSetting(webhook, webhookContainer);
            this.createResponseSetting(webhook, webhookContainer);
            this.createTestButton(webhook, webhookContainer);

            if (this.plugin.settings.webhooks.length > 1) {
                this.createRemoveButton(webhook, index, webhookContainer);
            }
        });

        const addWebhookContainer = containerEl.createDiv('add-webhook-container');
        addWebhookContainer.style.marginTop = '2em';
        
        new Setting(addWebhookContainer)
            .setName('Add New Webhook')
            .setDesc('Add another Webhook configuration')
            .addButton(button => button
                .setButtonText('+ Add Webhook')
                .onClick(async () => {
                    const newId = `webhook-${Date.now()}`;
                    const newWebhook = {
                        id: newId,
                        name: 'New Webhook',
                        url: '',
                        attachResponse: false
                    };
                    
                    this.plugin.settings.webhooks.push(newWebhook);
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }

    createNameSetting(webhook, container) {
        const setting = new Setting(container)
            .setName('Webhook Name')
            .setDesc('Enter a name for this Webhook')
            .addText(text => text
                .setPlaceholder('My Webhook')
                .setValue(webhook.name)
                .onChange(async (value) => {
                    webhook.name = value;
                    await this.plugin.saveSettings();
                }));
        
        // Remove the default border-top style from the setting element
        setting.settingEl.style.borderTop = 'none';
    }

    createUrlSetting(webhook, container) {
        new Setting(container)
            .setName('Webhook URL')
            .setDesc('Enter the URL where your notes will be sent')
            .addText(text => text
                .setPlaceholder('https://your-webhook-url')
                .setValue(webhook.url)
                .onChange(async (value) => {
                    webhook.url = value;
                    await this.plugin.saveSettings();
                }));
    }

    createResponseSetting(webhook, container) {
        new Setting(container)
            .setName('Attach Response')
            .setDesc('Append webhook response to the note')
            .addToggle(toggle => toggle
                .setValue(webhook.attachResponse)
                .onChange(async (value) => {
                    webhook.attachResponse = value;
                    await this.plugin.saveSettings();
                }));
    }

    createTestButton(webhook, container) {
        new Setting(container)
            .setName('Test Webhook')
            .setDesc('Send a test request to verify your Webhook configuration')
            .addButton(button => button
                .setButtonText('Test Webhook')
                .onClick(async () => {
                    if (!webhook.url) {
                        new Notice('Please configure Webhook URL first');
                        return;
                    }

                    try {
                        const testPayload = {
                            test: true,
                            timestamp: Date.now(),
                            message: 'Test Webhook from Obsidian'
                        };

                        const response = await requestUrl({
                            url: webhook.url,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(testPayload)
                        });

                        if (response.status < 400) {
                            new Notice(`Test Webhook sent successfully to ${webhook.name}`);
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } catch (error) {
                        new Notice(`Test failed: ${error.message}`);
                    }
                }));
    }

    createRemoveButton(webhook, index, container) {
        new Setting(container)
            .setName('Remove Webhook')
            .setDesc('Delete this Webhook configuration')
            .addButton(button => button
                .setButtonText('Remove')
                .setWarning()
                .onClick(async () => {
                    this.plugin.settings.webhooks = this.plugin.settings.webhooks.filter((_, i) => i !== index);
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }
}

module.exports = WebhookSettingsTab;