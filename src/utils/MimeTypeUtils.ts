export class MimeTypeUtils {
  private static readonly mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip'
  };

  static getMimeType(extension?: string): string {
    return this.mimeTypes[extension?.toLowerCase() ?? ''] || 'application/octet-stream';
  }

  static getExtensionFromMimeType(mimeType: string): string {
    for (const [ext, mime] of Object.entries(this.mimeTypes)) {
      if (mimeType.includes(mime)) return `.${ext}`;
    }
    return '.bin';
  }
}