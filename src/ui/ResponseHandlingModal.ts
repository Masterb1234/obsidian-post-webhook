import { App, Modal, Setting } from 'obsidian';
import { ResponseHandlingMode } from '../types';

export class ResponseHandlingModal extends Modal {
  private mode: ResponseHandlingMode = 'append';

  constructor(
    app: App,
    private onSubmit: (mode: ResponseHandlingMode, dontAskAgain: boolean) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Response Handling' });

    new Setting(contentEl)
      .setName('Mode')
      .setDesc('Choose how to handle the response')
      .addDropdown(dropdown => {
        dropdown
          .addOption('append', 'Append to note')
          .addOption('new', 'Create new note')
          .addOption('overwrite', 'Overwrite note')
          .setValue(this.mode)
          .onChange(value => {
            this.mode = value as ResponseHandlingMode;
          });
      });

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('Cancel')
        .onClick(() => this.close()))
      .addButton(btn => btn
        .setButtonText('Submit')
        .setCta()
        .onClick(() => {
          this.onSubmit(this.mode, false);
          this.close();
        }));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}