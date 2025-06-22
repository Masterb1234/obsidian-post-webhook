import { FuzzySuggestModal, TFile } from 'obsidian';
import { VariableNote } from '../../types';

export class VariableNoteSuggester extends FuzzySuggestModal<VariableNote> {
  private notes: VariableNote[];
  private onChoose: (note: VariableNote) => void;

  constructor(app: any, notes: VariableNote[], onChoose: (note: VariableNote) => void) {
    super(app);
    this.notes = notes;
    this.onChoose = onChoose;
  }

  getItems(): VariableNote[] {
    return this.notes;
  }

  getItemText(item: VariableNote): string {
    return item.title;
  }

  onChooseItem(item: VariableNote): void {
    this.onChoose(item);
  }

  renderSuggestion(item: any, el: HTMLElement) {
    el.createEl("div", { text: item.item.title });
    el.createEl("small", { text: item.item.path });
  }
}