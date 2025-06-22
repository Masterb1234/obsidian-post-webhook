import { MimeTypeUtils } from './MimeTypeUtils';

export class FileUtils {
  static generateFilename(contentType: string): string {
    const extension = MimeTypeUtils.getExtensionFromMimeType(contentType);
    const timestamp = Date.now();
    return `webhook-response-${timestamp}${extension}`;
  }
}