const { Notice } = require('obsidian');
const WebhookService = require('../services/WebhookService');
const SelectionCache = require('../utils/SelectionCache');

class WebhookCommands {
    constructor(plugin) {
        this.plugin = plugin;
        this.registeredCommands = new Set();
        this.selectionCache = new SelectionCache();
    }

    registerCommands() {
        this.unregisterCommands();

        this.plugin.settings.webhooks.forEach(webhook => {
            const noteCommandId = `send-to-webhook-${webhook.id}`;
            const noteCommand = {
                id: noteCommandId,
                name: `Send Note to ${webhook.name}`,
                callback: async () => {
                    const file = this.plugin.app.workspace.getActiveFile();
                    if (!file) {
                        new Notice('No active file');
                        return;
                    }

                    try {
                        const content = await this.plugin.app.vault.read(file);
                        const response = await WebhookService.sendContent(
                            this.plugin.app,
                            webhook.url,
                            content,
                            file.name,
                            file
                        );
                        
                        if (webhook.attachResponse && response.text) {
                            const responseContent = `\n\n---\n${response.text}`;
                            const newContent = content + responseContent;
                            await this.plugin.app.vault.modify(file, newContent);
                        }
                        
                        new Notice(`Successfully sent to ${webhook.name}`);
                    } catch (error) {
                        console.error('Webhook error:', error);
                        new Notice(`Error: ${error.message}`);
                    }
                }
            };
            this.plugin.addCommand(noteCommand);
            this.registeredCommands.add(noteCommandId);

            const selectionCommandId = `send-selection-to-webhook-${webhook.id}`;
            const selectionCommand = {
                id: selectionCommandId,
                name: `Send Selection to ${webhook.name}`,
                callback: async () => {
                    const file = this.plugin.app.workspace.getActiveFile();
                    if (!file) {
                        new Notice('No active file');
                        return;
                    }

                    const selection = this.selectionCache.getSelection();
                    if (!selection) {
                        new Notice('No text selected');
                        return;
                    }

                    try {
                        const fullContent = await this.plugin.app.vault.read(file);
                        const response = await WebhookService.sendContent(
                            this.plugin.app,
                            webhook.url,
                            fullContent,
                            `${file.name} (selection)`,
                            file,
                            selection
                        );

                        if (webhook.attachResponse && response.text) {
                            const selectionIndex = fullContent.indexOf(selection);
                            if (selectionIndex !== -1) {
                                const responseContent = `\n${response.text}`;
                                const newContent = 
                                    fullContent.substring(0, selectionIndex + selection.length) + 
                                    responseContent + 
                                    fullContent.substring(selectionIndex + selection.length);
                                await this.plugin.app.vault.modify(file, newContent);
                            }
                        }

                        new Notice(`Successfully sent selection to ${webhook.name}`);
                    } catch (error) {
                        console.error('Webhook error:', error);
                        new Notice(`Error: ${error.message}`);
                    }
                }
            };
            this.plugin.addCommand(selectionCommand);
            this.registeredCommands.add(selectionCommandId);
        });
    }

    unregisterCommands() {
        this.registeredCommands.forEach(commandId => {
            const command = this.plugin.app.commands.commands[commandId];
            if (command) {
                this.plugin.app.commands.removeCommand(commandId);
            }
        });
        this.registeredCommands.clear();
    }
}

module.exports = WebhookCommands;