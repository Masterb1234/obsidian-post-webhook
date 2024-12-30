import { App, TFile, arrayBufferToBase64, TAbstractFile } from 'obsidian';
import { Attachment } from '../types';
import { MimeTypeUtils } from '../utils/MimeTypeUtils';
import { YAMLParser } from '../utils/YAMLParser';

export class AttachmentService {
  static async getAttachments(app: App, file: TFile, excludeAll = false): Promise<Attachment[]> {
    if (excludeAll) {
      return [];
    }

    const attachments: Attachment[] = [];
    const cache = app.metadataCache.getFileCache(file);
    
    if (!cache) {
      return attachments;
    }

    const fileContent = await app.vault.read(file);
    const excludeList = await YAMLParser.getExcludedAttachments(fileContent);
    await this.processEmbeds(app, file, cache.embeds, excludeList, attachments);

    return attachments;
  }

  private static async processEmbeds(
    app: App,
    file: TFile,
    embeds: any[] | undefined,
    excludeList: string[],
    attachments: Attachment[]
  ): Promise<void> {
    if (!embeds) return;

    for (const embed of embeds) {
      if (!embed.link) continue;

      const linkedFile = app.metadataCache.getFirstLinkpathDest(embed.link, file.path);
      if (!linkedFile || !(linkedFile instanceof TFile) || excludeList.includes(linkedFile.name)) {
        continue;
      }

      const attachment = await this.processAttachment(app, linkedFile);
      if (attachment) {
        attachments.push(attachment);
      }
    }
  }

  private static async processAttachment(app: App, file: TFile): Promise<Attachment | null> {
    try {
      const arrayBuffer = await app.vault.readBinary(file);
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const extension = file.extension.toLowerCase();
      const mimeType = MimeTypeUtils.getMimeType(extension);

      return {
        name: file.name,
        type: extension,
        mimeType: mimeType,
        size: arrayBuffer.byteLength,
        data: base64Data,
        path: file.path
      };
    } catch (error) {
      console.error(`Failed to process attachment ${file.name}:`, error);
      return null;
    }
  }
}