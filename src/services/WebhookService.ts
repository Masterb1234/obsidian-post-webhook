import { App, TFile, requestUrl, Editor, MarkdownView } from 'obsidian';
import { WebhookResponse, VariableNote, Webhook, ResponseHandlingMode } from '../types';
import { AttachmentService } from './AttachmentService';
import { PayloadService } from './PayloadService';
import { ResponseHandler } from './ResponseHandler';
import { UrlUtils } from '../utils/UrlUtils';
import { VariableNoteModal } from '../ui/VariableNoteModal';
import { ResponseHandlingModal } from '../ui/ResponseHandlingModal';
import PostWebhookPlugin from '../main';

export class WebhookService {
  static async sendContent(
    app: App, 
    webhookUrl: string, 
    content: string, 
    filename: string, 
    file: TFile, 
    selectedText?: string
  ): Promise<WebhookResponse> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    if (!UrlUtils.validateUrl(webhookUrl)) {
      throw new Error('Invalid Webhook URL. Must be a valid HTTP or HTTPS URL');
    }

    try {
      const plugin = (app as any).plugins.plugins['post-webhook'] as PostWebhookPlugin;
      const webhook = plugin?.settings.webhooks.find((w: Webhook) => w.url === webhookUrl);
      
      let variableNote: VariableNote | null = null;
      
      // Only show variable note modal if the webhook has includeVariableNote enabled
      if (webhook?.includeVariableNote) {
        variableNote = await new Promise((resolve) => {
          new VariableNoteModal(app, 
            (note) => resolve(note),
            () => resolve(null)
          ).open();
        });
        
        if (!variableNote) {
          throw new Error('Variable note selection cancelled');
        }
      }
      
      const attachments = await AttachmentService.getAttachments(app, file, webhook?.excludeAttachments);
      
      // If no selectedText is provided, try to get it from the active editor
      if (!selectedText) {
        const activeView = app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView?.editor) {
          selectedText = activeView.editor.getSelection();
        }
      }
      
      const payload = PayloadService.createPayload(
        content, 
        filename, 
        attachments, 
        selectedText, 
        variableNote,
        webhook?.processInlineFields || false
      );

      const response = await requestUrl({
        url: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status >= 400) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const processedResponse = await ResponseHandler.processResponse(app, response);

      if (webhook?.responseHandling) {
        let mode = webhook.responseHandling;
        
        // Only ask for response handling if mode is 'ask'
        if (mode === 'ask') {
          const modalResult = await new Promise<{ mode: ResponseHandlingMode, dontAskAgain: boolean }>((resolve) => {
            new ResponseHandlingModal(app, (mode, dontAskAgain) => {
              resolve({ mode, dontAskAgain });
            }).open();
          });
          
          mode = modalResult.mode;
          
          // Update webhook settings if don't ask again is checked
          if (modalResult.dontAskAgain) {
            webhook.responseHandling = mode;
            await plugin.saveSettings();
          }
        }

        await ResponseHandler.handleProcessedResponse(app, processedResponse, file, selectedText || null, mode);
      }

      return { 
        status: response.status,
        text: processedResponse 
      };

    } catch (error) {
      if (error.message === 'Variable note selection cancelled') {
        throw error;
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Could not connect to the Webhook URL. Please check your internet connection and the URL');
      }
      throw new Error(`Failed to send Webhook: ${error.message}`);
    }
  }
}