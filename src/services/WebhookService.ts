import { App, TFile, requestUrl } from 'obsidian';
import { WebhookResponse, VariableNote, Webhook } from '../types';
import { AttachmentService } from './AttachmentService';
import { PayloadService } from './PayloadService';
import { ResponseHandler } from './ResponseHandler';
import { UrlUtils } from '../utils/UrlUtils';
import { VariableNoteModal } from '../ui/VariableNoteModal';

export class WebhookService {
  static async sendContent(
    app: App, 
    webhookUrl: string, 
    content: string, 
    filename: string, 
    file: TFile, 
    selectedText?: string | null
  ): Promise<WebhookResponse> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    if (!UrlUtils.validateUrl(webhookUrl)) {
      throw new Error('Invalid Webhook URL. Must be a valid HTTP or HTTPS URL');
    }

    try {
      // Safe type assertion for Obsidian's internal API
      const plugin = (app as any).plugins?.getPlugin('post-webhook');
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
      const payload = PayloadService.createPayload(content, filename, attachments, selectedText, variableNote);

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