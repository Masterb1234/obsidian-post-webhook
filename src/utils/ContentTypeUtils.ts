export class ContentTypeUtils {
  static isTextContent(contentType = ''): boolean {
    const textTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/ecmascript',
      'application/x-httpd-php',
      'application/x-yaml'
    ];
    
    contentType = contentType.toLowerCase();
    return textTypes.some(type => contentType.includes(type));
  }
}