import { App, TFile, RequestUrlResponse } from 'obsidian';
import { ContentTypeUtils } from '../utils/ContentTypeUtils';
import { FileUtils } from '../utils/FileUtils';

export class ResponseHandler {
  static async processResponse(app: App, response: RequestUrlResponse): Promise<string> {
    const contentType = (response.headers?.['content-type'] || 
                        response.headers?.['Content-Type'] || '').toLowerCase();

    if (contentType.includes('application/json')) {
      return this.formatJsonResponse(response);
    }

    if (ContentTypeUtils.isTextContent(contentType)) {
      return this.formatTextResponse(response);
    }

    return this.processBinaryResponse(app, response, contentType);
  }

  private static async formatJsonResponse(response: RequestUrlResponse): Promise<string> {
    try {
      const jsonData = await response.json;
      return '```json\n' + JSON.stringify(jsonData, null, 2) + '\n```';
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return 'Failed to parse JSON response';
    }
  }

  private static async formatTextResponse(response: RequestUrlResponse): Promise<string> {
    try {
      return await response.text;
    } catch (error) {
      console.error('Failed to get text response:', error);
      return 'Failed to get text response';
    }
  }

  private static async processBinaryResponse(
    app: App, 
    response: RequestUrlResponse,
    contentType: string
  ): Promise<string> {
    try {
      const buffer = await response.arrayBuffer;
      const filename = FileUtils.generateFilename(contentType);
      const attachmentFolder = (app.vault as any).config?.attachmentFolderPath || 'attachments';
      
      try {
        await app.vault.createFolder(attachmentFolder);
      } catch (error) {
        // Ignore error if folder already exists
      }
      
      const file = await app.vault.createBinary(
        `${attachmentFolder}/${filename}`,
        buffer
      );

      return `![[${file.name}]]`;
    } catch (error) {
      console.error('Failed to process binary response:', error);
      return 'Failed to process binary response';
    }
  }
}