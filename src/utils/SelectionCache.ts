import { Editor, MarkdownView, WorkspaceLeaf } from 'obsidian';

export class SelectionCache {
  private cache: {
    text: string;
    timestamp: number;
  };
  private readonly CACHE_TIMEOUT = 5000;
  private observer: MutationObserver;

  constructor() {
    this.cache = {
      text: '',
      timestamp: 0
    };
    this.setupMutationObserver();
    this.setupSelectionListener();
  }

  private setupMutationObserver(): void {
    this.observer = new MutationObserver(() => {
      this.updateFromEditor();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  private setupSelectionListener(): void {
    document.addEventListener('selectionchange', () => {
      this.updateFromEditor();
    });
  }

  private updateFromEditor(): void {
    const activeLeaf = (window as any).app?.workspace?.activeLeaf as WorkspaceLeaf;
    if (!activeLeaf) return;

    const view = activeLeaf.view as MarkdownView;
    const editor = view?.editor;
    
    if (editor?.getSelection) {
      const selection = editor.getSelection();
      if (selection) {
        this.updateCache(selection);
      }
    }
  }

  private updateCache(text: string): void {
    this.cache = {
      text,
      timestamp: Date.now()
    };
  }

  getSelection(): string {
    const activeLeaf = (window as any).app?.workspace?.activeLeaf as WorkspaceLeaf;
    if (!activeLeaf) return '';

    const view = activeLeaf.view as MarkdownView;
    const editor = view?.editor;
    
    if (editor?.getSelection) {
      const selection = editor.getSelection();
      if (selection) {
        return selection;
      }
    }

    const currentTime = Date.now();
    if (currentTime - this.cache.timestamp < this.CACHE_TIMEOUT) {
      return this.cache.text;
    }

    return '';
  }

  destroy(): void {
    this.observer?.disconnect();
  }
}