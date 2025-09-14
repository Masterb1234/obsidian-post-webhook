import { App, TFile, RequestUrlResponse, Notice } from 'obsidian';
import { ContentTypeUtils } from '../utils/ContentTypeUtils';
import { FileUtils } from '../utils/FileUtils';
import { ResponseHandlingMode } from '../types';

export class ResponseHandler {
  static async processResponse(app: App, response: RequestUrlResponse): Promise<string> {
    const contentType = (response.headers?.['content-type'] || 
                        response.headers?.['Content-Type'] || '').toLowerCase();

    if (contentType.includes('application/json')) {
      return this.formatJsonResponse(app, response);
    }

    if (ContentTypeUtils.isTextContent(contentType)) {
      return this.formatTextResponse(response);
    }

    return this.processBinaryResponse(app, response, contentType);
  }

  static async handleProcessedResponse(
    app: App,
    response: string,
    file: TFile,
    selection: string | null,
    mode: ResponseHandlingMode
  ): Promise<void> {
    switch (mode) {
      case 'append':
        await this.appendResponse(app, response, file, selection);
        break;
      case 'new':
        await this.createNewNote(app, response, file);
        break;
      case 'overwrite':
        await this.overwriteNote(app, response, file);
        break;
      case 'none':
        // Do nothing
        break;
    }
  }

  private static async appendResponse(
    app: App,
    response: string,
    file: TFile,
    selection: string | null
  ): Promise<void> {
    const content = await app.vault.read(file);
    let newContent: string;

    if (selection) {
      // Find the selection in the content and append after it
      const selectionIndex = content.indexOf(selection);
      if (selectionIndex !== -1) {
        newContent = content.slice(0, selectionIndex + selection.length) +
                    '\n\n' + response + '\n\n' +
                    content.slice(selectionIndex + selection.length);
      } else {
        newContent = content + '\n\n' + response;
      }
    } else {
      newContent = content + '\n\n' + response;
    }

    await app.vault.modify(file, newContent);
  }

  private static async createNewNote(
    app: App,
    response: string,
    originalFile: TFile
  ): Promise<void> {
    const newName = await this.generateNewFileName(app, originalFile);
    await app.vault.create(newName, response);
  }

  private static async overwriteNote(
    app: App,
    response: string,
    file: TFile
  ): Promise<void> {
    await app.vault.modify(file, response);
  }

  private static async generateNewFileName(app: App, file: TFile): Promise<string> {
    const basePath = file.path.substring(0, file.path.lastIndexOf('/') + 1);
    let baseName = file.basename;
    const extension = file.extension;
    
    const versionRegex = / v(\d+)$/;
    const match = baseName.match(versionRegex);
    let version = 1;

    if (match) {
      version = parseInt(match[1]) + 1;
      baseName = baseName.replace(versionRegex, '');
    }

    let finalName = '';
    let exists = true;
    
    while (exists) {
      finalName = `${basePath}${baseName} v${version}.${extension}`;
      exists = await app.vault.adapter.exists(finalName);
      version++;
    }

    return finalName;
  }

  private static async formatJsonResponse(app: App, response: RequestUrlResponse): Promise<string> {
    try {
      const responseText = response.text;
      if (!responseText || responseText.trim() === '') {
        return ''; // Handle empty response
      }

      const originalJsonData = await response.json;
      let dataToCheck = originalJsonData;

      // Handle n8n's array-based output by checking the first element
      if (Array.isArray(originalJsonData) && originalJsonData.length > 0) {
        dataToCheck = originalJsonData[0];
      }

      // Check if the data (either the object or the first element of the array) is a valid complex response
      if (dataToCheck && typeof dataToCheck.content === 'string' && Array.isArray(dataToCheck.attachments)) {
        return this.processComplexJsonResponse(app, dataToCheck);
      } else {
        // If it's not a complex response, return the original full JSON in a code block
        return '```json\n' + JSON.stringify(originalJsonData, null, 2) + '\n```';
      }
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return 'Failed to parse JSON response';
    }
  }

  private static async processComplexJsonResponse(app: App, payload: { content: string, attachments: any[] }): Promise<string> {
    const attachmentFolder = (app.vault as any).config?.attachmentFolderPath || 'attachments';
    
    try {
      await app.vault.createFolder(attachmentFolder);
    } catch (error) {
      // Ignore error if folder already exists
    }

    for (const attachment of payload.attachments) {
      if (attachment.name && attachment.data) {
        try {
          const decodedData = Buffer.from(attachment.data, 'base64');
          const filePath = `${attachmentFolder}/${attachment.name}`;
          await app.vault.createBinary(filePath, decodedData);
        } catch (error) {
          console.error(`Failed to process attachment ${attachment.name}:`, error);
        }
      }
    }

    return payload.content;
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