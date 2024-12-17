/**
 * Utility functions for handling content type detection
 */

class ContentTypeUtils {
    /**
     * Determines if the content type represents text
     * @param {string} contentType - The content type header value
     * @returns {boolean} - True if the content type represents text
     */
    static isTextContent(contentType = '') {
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

module.exports = ContentTypeUtils;