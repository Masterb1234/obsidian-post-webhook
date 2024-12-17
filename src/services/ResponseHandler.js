const { TFile } = require('obsidian');

class ResponseHandler {
    static async processResponse(app, response) {
        const contentType = response.headers?.['content-type'] || '';

        if (contentType.includes('application/json')) {
            return this.handleJsonResponse(response);
        }

        if (contentType.includes('text/')) {
            return this.handleTextResponse(response);
        }

        return this.handleBinaryResponse(app, response);
    }

    static async handleJsonResponse(response) {
        const jsonData = response.json;
        return '```json\n' + JSON.stringify(jsonData, null, 2) + '\n```';
    }

    static async handleTextResponse(response) {
        return response.text;
    }

    static async handleBinaryResponse(app, response) {
        const buffer = await response.arrayBuffer;
        const filename = this.generateFilename(response);
        
        // Create file in Obsidian's default attachments folder
        const file = await app.vault.createBinary(
            `${app.vault.config.attachmentFolderPath}/${filename}`,
            buffer
        );

        // Return markdown link using Obsidian's link format
        return `![[${file.name}]]`;
    }

    static generateFilename(response) {
        const contentDisposition = response.headers?.['content-disposition'];
        const defaultExt = this.getExtensionFromContentType(response.headers?.['content-type']);
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) return match[1];
        }

        return `response-${Date.now()}${defaultExt}`;
    }

    static getExtensionFromContentType(contentType = '') {
        const mimeToExt = {
            // Images
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'image/bmp': '.bmp',
            'image/tiff': '.tiff',
            
            // Audio
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'audio/wav': '.wav',
            'audio/wave': '.wav',
            'audio/x-wav': '.wav',
            'audio/ogg': '.ogg',
            'audio/opus': '.opus',
            'audio/aac': '.aac',
            'audio/mp4': '.m4a',
            'audio/x-m4a': '.m4a',
            'audio/flac': '.flac',
            
            // Video
            'video/mp4': '.mp4',
            'video/mpeg': '.mpeg',
            'video/webm': '.webm',
            'video/ogg': '.ogv',
            'video/quicktime': '.mov',
            'video/x-msvideo': '.avi',
            'video/x-matroska': '.mkv',
            
            // Documents
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            
            // Archives
            'application/zip': '.zip',
            'application/x-rar-compressed': '.rar',
            'application/x-7z-compressed': '.7z',
            'application/x-tar': '.tar',
            'application/gzip': '.gz',
            
            // Other
            'application/json': '.json',
            'application/xml': '.xml',
            'text/plain': '.txt',
            'text/csv': '.csv',
            'text/markdown': '.md'
        };

        for (const [mime, ext] of Object.entries(mimeToExt)) {
            if (contentType.includes(mime)) return ext;
        }

        return '.bin';
    }
}

module.exports = ResponseHandler;