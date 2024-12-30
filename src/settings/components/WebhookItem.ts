import { Setting } from 'obsidian';
import { Webhook } from '../../types';

export class WebhookItem {
  constructor(
    private container: HTMLElement,
    private webhook: Webhook,
    private index: number,
    private onUpdate: (index: number, updates: Partial<Webhook>) => Promise<void>,
    private onRemove: (index: number) => Promise<void>
  ) {
    this.display();
  }

  private display(): void {
    new Setting(this.container)
      .setName('Webhook Name')
      .setDesc('Enter a name for this Webhook')
      .addText(text => text
        .setValue(this.webhook.name)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { name: value });
        }));

    new Setting(this.container)
      .setName('Webhook URL')
      .setDesc('Enter the URL for this Webhook')
      .addText(text => text
        .setValue(this.webhook.url)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { url: value });
        }));

    new Setting(this.container)
      .setName('Insert Response')
      .setDesc('Append Webhook response to the note')
      .addToggle(toggle => toggle
        .setValue(this.webhook.attachResponse)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { attachResponse: value });
        }));

    new Setting(this.container)
      .setName('Exclude Attachments')
      .setDesc('Do not send any attachments with this Webhook')
      .addToggle(toggle => toggle
        .setValue(this.webhook.excludeAttachments || false)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { excludeAttachments: value });
        }));

    new Setting(this.container)
      .setName('Include Webhook context')
      .setDesc('Enable adding another note with context before sending this Webhook')
      .addToggle(toggle => toggle
        .setValue(this.webhook.includeVariableNote || false)
        .onChange(async (value) => {
          await this.onUpdate(this.index, { includeVariableNote: value });
        }));

    new Setting(this.container)
      .addButton(button => button
        .setButtonText('Remove Webhook')
        .setClass('mod-warning')
        .onClick(async () => {
          await this.onRemove(this.index);
        }));
  }
}