import { Notice, Command, TFile, App, Editor, MarkdownView } from 'obsidian';
import { SelectionCache } from '../utils/SelectionCache';
import { WebhookService } from '../services/WebhookService';
import PostWebhookPlugin from '../main';

export class WebhookCommands {
  private plugin: PostWebhookPlugin;
  private registeredCommands: Set<string>;
  selectionCache: SelectionCache;

  constructor(plugin: PostWebhookPlugin) {
    this.plugin = plugin;
    this.registeredCommands = new Set();
    this.selectionCache = new SelectionCache();
  }

  registerCommands(): void {
    this.unregisterCommands();

    this.plugin.settings.webhooks.forEach(webhook => {
      const noteCommandId = `post-webhook-note-${webhook.id}`;
      this.plugin.addCommand({
        id: noteCommandId,
        name: `Send note to ${webhook.name}`,
        callback: async () => {
          const activeFile = this.plugin.app.workspace.getActiveFile();
          if (!activeFile) {
            new Notice('No active file');
            return;
          }

          try {
            const content = await this.plugin.app.vault.read(activeFile);
            const response = await WebhookService.sendContent(
              this.plugin.app,
              webhook.url,
              content,
              activeFile.name,
              activeFile
            );

            if (webhook.attachResponse && response.text) {
              const newContent = `${content}\n\n${response.text}`;
              await this.plugin.app.vault.modify(activeFile, newContent);
            }

            new Notice(`Note sent to ${webhook.name}`);
          } catch (error) {
            new Notice(`Failed to send note: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      });
      this.registeredCommands.add(noteCommandId);

      const selectionCommandId = `post-webhook-selection-${webhook.id}`;
      this.plugin.addCommand({
        id: selectionCommandId,
        name: `Send selection to ${webhook.name}`,
        editorCallback: async (editor) => {
          const activeFile = this.plugin.app.workspace.getActiveFile();
          if (!activeFile) {
            new Notice('No active file');
            return;
          }

          const selection = editor.getSelection();
          if (!selection) {
            new Notice('No text selected');
            return;
          }

          try {
            const content = await this.plugin.app.vault.read(activeFile);
            const response = await WebhookService.sendContent(
              this.plugin.app,
              webhook.url,
              content,
              activeFile.name,
              activeFile,
              selection
            );

            if (webhook.attachResponse && response.text) {
              const selectionRange = editor.listSelections()[0];
              const end = selectionRange.head.line > selectionRange.anchor.line ? 
                         selectionRange.head : selectionRange.anchor;
              editor.replaceRange(`\n${response.text}`, end);
            }

            new Notice(`Selection sent to ${webhook.name}`);
          } catch (error) {
            new Notice(`Failed to send selection: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      });
      this.registeredCommands.add(selectionCommandId);
    });
  }

  unregisterCommands(): void {
    this.registeredCommands.forEach(commandId => {
      (this.plugin.app as any).commands.removeCommand(commandId);
    });
    this.registeredCommands.clear();
  }
}