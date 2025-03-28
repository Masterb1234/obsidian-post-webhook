import { Modal, Setting, App, Notice } from 'obsidian';
import { Webhook, ResponseHandlingMode } from '../../types';

export class WebhookItem extends Modal {
  constructor(
    app: App,
    private webhook: Webhook,
    private index: number,
    private onUpdate: (index: number, updates: Partial<Webhook>) => Promise<void>,
    private onRemove: (index: number) => Promise<void>
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    contentEl.createEl('h2', { text: 'Edit Webhook' });

    new Setting(contentEl)
      .setName('Webhook Name')
      .setDesc('Enter a name for this Webhook')
      .addText(text => text
        .setValue(this.webhook.name)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { name: value });
        }));

    new Setting(contentEl)
      .setName('Webhook URL')
      .setDesc('Enter the URL for this Webhook')
      .addText(text => text
        .setValue(this.webhook.url)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { url: value });
        }));

    new Setting(contentEl)
      .setName('Response Handling')
      .setDesc('Choose how to handle the Webhook response')
      .addDropdown(dropdown => {
        dropdown
          .addOption('none', 'Do not use response')
          .addOption('append', 'Append to note')
          .addOption('new', 'Create new note')
          .addOption('overwrite', 'Overwrite note')
          .addOption('ask', 'Ask every time')
          .setValue(this.webhook.responseHandling)
          .onChange(async (value) => {
            await this.onUpdate(this.index, {
              responseHandling: value as ResponseHandlingMode
            });
          });
      });

    new Setting(contentEl)
      .setName('Process Inline Fields')
      .setDesc('Include inline fields (field:: value) in the webhook payload')
      .addToggle(toggle => toggle
        .setValue(this.webhook.processInlineFields || false)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { processInlineFields: value });
        }));

    new Setting(contentEl)
      .setName('Exclude Attachments')
      .setDesc('Do not send any attachments with this Webhook')
      .addToggle(toggle => toggle
        .setValue(this.webhook.excludeAttachments || false)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { excludeAttachments: value });
        }));

    new Setting(contentEl)
      .setName('Include Webhook context')
      .setDesc('Enable adding another note with context before sending this Webhook')
      .addToggle(toggle => toggle
        .setValue(this.webhook.includeVariableNote || false)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { includeVariableNote: value });
        }));

    new Setting(contentEl)
      .setName('Custom Headers')
      .setDesc('Enter headers as JSON')
      .addTextArea(text => {
        text
          .setValue(this.webhook.headers || '')
          .setPlaceholder('{\n  "Authorization": "Bearer your-token",\n  "X-Custom-Header": "custom-value"\n}');
        
        text.inputEl.addEventListener('blur', async () => {
          const value = text.getValue().trim();
          if (!value) {
            await this.onUpdate(this.index, { headers: '' });
            return;
          }

          try {
            const parsedHeaders = JSON.parse(value);
            await this.onUpdate(this.index, { headers: JSON.stringify(parsedHeaders) });
          } catch (e) {
            new Notice('Invalid JSON format in headers');
            text.setValue(this.webhook.headers || '');
          }
        });

        text.inputEl.rows = 4;
        text.inputEl.cols = 40;
      });

    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Remove Webhook')
        .setClass('mod-warning')
        .onClick(async () => {
          await this.onRemove(this.index);
          this.close();
        }));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}