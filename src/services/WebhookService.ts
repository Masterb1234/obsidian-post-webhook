import { App, TFile, requestUrl, Editor, MarkdownView, Notice, setIcon } from 'obsidian';
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
    selectedText?: string,
    isSelectionCommand: boolean = false,
    statusBarItem?: HTMLElement
  ): Promise<WebhookResponse> {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    if (!UrlUtils.validateUrl(webhookUrl)) {
      throw new Error('Invalid Webhook URL. Must be a valid HTTP or HTTPS URL');
    }

    let animationInterval: NodeJS.Timeout | undefined;

    try {
      const plugin = (app as any).plugins.plugins['post-webhook'] as PostWebhookPlugin;
      const webhook = plugin?.settings.webhooks.find((w: Webhook) => w.url === webhookUrl);

      if (statusBarItem && webhook) {
        statusBarItem.empty();
        statusBarItem.style.display = 'flex';
        statusBarItem.style.alignItems = 'center';

        const iconEl = statusBarItem.createSpan();
        setIcon(iconEl, 'loader');

        let rotation = 0;
        animationInterval = setInterval(() => {
          rotation = (rotation + 10) % 360;
          iconEl.style.transform = `rotate(${rotation}deg)`;
        }, 100);

        statusBarItem.createSpan({
          text: `Sending to ${webhook.name}...`
        });
        statusBarItem.show();
      }
      
      let variableNote: VariableNote | null = null;
      
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

      let renderedHtml: string | undefined;
      if (webhook?.sendRenderedHtml) {
        const activeView = app.workspace.activeLeaf?.view as MarkdownView;
        if (activeView?.getMode() === 'preview') {
          const previewSizer = activeView.previewMode?.containerEl.querySelector('.markdown-preview-sizer');
          if (previewSizer) {
            const contentElements = Array.from(previewSizer.children).filter(el => 
              !el.classList.contains('mod-header') &&
              !el.classList.contains('mod-footer') &&
              !el.classList.contains('markdown-preview-pusher')
            );
            renderedHtml = contentElements.map(el => el.outerHTML).join('');
          }
        } else {
          new Notice('To send rendered HTML, the note must be in Reading view.');
        }
      }
      
      const attachments = await AttachmentService.getAttachments(app, file, webhook?.excludeAttachments);
      
      let effectiveSelection = selectedText;
      if (!effectiveSelection && isSelectionCommand) {
        const activeView = app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView?.editor) {
          effectiveSelection = activeView.editor.getSelection();
        }
      }
      
      const payload = PayloadService.createPayload(
        app,
        content,
        filename,
        '/' + file.path,
        attachments,
        file,
        effectiveSelection || null,
        variableNote,
        webhook?.processInlineFields || false,
        renderedHtml,
        webhook?.convertInternalLinksToObsidianURIs || false,
        webhook?.includeRawContent || false
      );

      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (webhook?.headers) {
        try {
          let customHeaders: Record<string, string>;
          
          if (typeof webhook.headers === 'object') {
            customHeaders = webhook.headers;
          } else {
            customHeaders = JSON.parse(webhook.headers);
          }

          headers = {
            ...customHeaders,
            ...headers
          };
        } catch (e) {
          console.error('Failed to parse custom headers:', e);
          throw new Error('Invalid JSON in custom headers');
        }
      }

      let response;
      try {
        const requestPromise = requestUrl({
          url: webhookUrl,
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        const timeoutSeconds = webhook?.timeout;

        if (timeoutSeconds && timeoutSeconds > 0) {
          let timeoutId: any;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Request timed out after ${timeoutSeconds} seconds`));
            }, timeoutSeconds * 1000);
          });

          try {
            response = await Promise.race([requestPromise, timeoutPromise]);
          } finally {
            clearTimeout(timeoutId);
          }
        } else {
          response = await requestPromise;
        }
      } catch (error: any) {
        const status = error?.status;
        const message = error instanceof Error ? error.message : String(error);
        if (status === 404 || message.includes('404')) {
          throw new Error('Request failed: 404 (Not Found). The URL may be incorrect, or the endpoint may be expecting a GET request instead of a POST request.');
        }
        if (status === 405 || message.includes('405')) {
          throw new Error('Request failed: 405 (Method Not Allowed). The endpoint does not support POST requests.');
        }
        if (status) {
          throw new Error(`Request failed: ${status}`);
        }
        throw error;
      }

      const processedResponse = await ResponseHandler.processResponse(app, response);

      if (webhook?.responseHandling) {
        let mode = webhook.responseHandling;
        
        if (mode === 'ask') {
          const modalResult = await new Promise<{ mode: ResponseHandlingMode, dontAskAgain: boolean }>((resolve) => {
            new ResponseHandlingModal(app, (mode, dontAskAgain) => {
              resolve({ mode, dontAskAgain });
            }).open();
          });
          
          mode = modalResult.mode;
          
          if (modalResult.dontAskAgain) {
            webhook.responseHandling = mode;
            await plugin.saveSettings();
          }
        }

        await ResponseHandler.handleProcessedResponse(
          app, 
          processedResponse, 
          file, 
          isSelectionCommand ? (effectiveSelection || null) : null, 
          mode
        );
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
    } finally {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      if (statusBarItem) {
        statusBarItem.hide();
      }
    }
  }
}
