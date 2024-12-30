import { Setting } from 'obsidian';
import { VariableNote } from '../../types';

export class ModalUI {
  constructor(
    private contentEl: HTMLElement,
    private notes: VariableNote[],
    private onNoteSelect: (note: VariableNote) => void,
    private onSubmit: () => void,
    private onCancel: () => void
  ) {
    this.display();
  }

  private display() {
    this.contentEl.empty();

    new Setting(this.contentEl)
      .setName('Select Variable Note')
      .setDesc('Choose a note containing variables to include in the Webhook payload')
      .addDropdown(dropdown => {
        this.notes.forEach(note => {
          dropdown.addOption(note.path, note.title);
        });
        
        dropdown.onChange(value => {
          const selectedNote = this.notes.find(note => note.path === value);
          if (selectedNote) {
            this.onNoteSelect(selectedNote);
          }
        });
      });

    new Setting(this.contentEl)
      .addButton(btn => btn
        .setButtonText('Cancel')
        .onClick(() => this.onCancel()))
      .addButton(btn => btn
        .setButtonText('Submit')
        .setCta()
        .onClick(() => this.onSubmit()));
  }
}