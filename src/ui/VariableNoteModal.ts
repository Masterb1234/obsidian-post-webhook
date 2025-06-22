import { Modal, App } from 'obsidian';
import { VariableNote, IVariableNoteModal } from '../types';
import { VariableNoteService } from '../services/VariableNoteService';
import { VariableNoteSuggester } from './components/VariableNoteSuggester';

export class VariableNoteModal extends Modal implements IVariableNoteModal {
  private notes: VariableNote[] = [];
  private selectedNote: VariableNote | null = null;
  private wasSubmitted = false;
  onSubmit: (note: VariableNote | null) => void;
  onCancel: () => void;

  constructor(app: App, onSubmit: (note: VariableNote | null) => void, onCancel: () => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  async onOpen() {
    try {
      this.notes = await VariableNoteService.findVariableNotes(this.app.vault, this.app.metadataCache);
      
      if (this.notes.length === 0) {
        this.contentEl.createEl('div', { text: 'No context notes found. Add post-webhook: true to note frontmatter.' });
        return;
      }

      // Set wasSubmitted to true before opening suggester
      this.wasSubmitted = true;
      this.close();

      // Open the suggester after closing this modal
      new VariableNoteSuggester(
        this.app,
        this.notes,
        (note: VariableNote) => {
          this.selectedNote = note;
          this.onSubmit(note);
        }
      ).open();

    } catch (error) {
      this.contentEl.createEl('div', { text: 'Error loading context notes.' });
      console.error('Error loading context notes:', error);
    }
  }

  onClose() {
    if (!this.wasSubmitted) {
      this.onCancel();
    }
    this.contentEl.empty();
  }
}