import { Notice, Command, TFile, App, Editor, MarkdownView } from 'obsidian';
import { WebhookService } from '../services/WebhookService';
import PostWebhookPlugin from '../main';

export class WebhookCommands {
  private plugin: PostWebhookPlugin;
  private registeredCommands: Set<string>;

  constructor(plugin: PostWebhookPlugin) {
    this.plugin = plugin;
    this.registeredCommands = new Set();
  }

  registerCommands(): void {
    // First, unregister all existing commands
    this.unregisterCommands();

    this.plugin.settings.webhooks.forEach(webhook => {
      // Skip registration for disabled webhooks
      if (webhook.enabled === false) {
        return;
      }

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
            await WebhookService.sendContent(
              this.plugin.app,
              webhook.url,
              content,
              activeFile.name,
              activeFile,
              undefined,
              false // Not a selection command
            );

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
        editorCallback: async (editor: Editor, view: MarkdownView) => {
          const activeFile = view.file;
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
            await WebhookService.sendContent(
              this.plugin.app,
              webhook.url,
              content,
              activeFile.name,
              activeFile,
              selection,
              true // This is a selection command
            );

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
    // Remove all registered commands
    this.registeredCommands.forEach(commandId => {
      // Use the app's command system to remove the command
      const commands = (this.plugin.app as any).commands;
      if (commands && commands.removeCommand) {
        commands.removeCommand(commandId);
      }
    });
    this.registeredCommands.clear();
  }
}