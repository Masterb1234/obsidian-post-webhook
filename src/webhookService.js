const YAML = require('yaml');

class WebhookService {
    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static parseYamlFrontmatter(content) {
        const yamlRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(yamlRegex);
        
        if (match) {
            try {
                const yamlContent = match[1];
                const parsedYaml = YAML.parse(yamlContent);
                const remainingContent = content.slice(match[0].length).trim();
                return {
                    frontmatter: parsedYaml,
                    content: remainingContent
                };
            } catch (error) {
                console.error('YAML parsing error:', error);
                return {
                    frontmatter: {},
                    content: content
                };
            }
        }
        
        return {
            frontmatter: {},
            content: content
        };
    }

    static async getAttachments(app, content, notePath) {
        const attachments = [];
        const attachmentRegex = /!?\[\[([^\]]+?)(?:\|[^\]]+)?\]\]|!\[(.*?)\]\(([^)]+)\)/g;
        const matches = [...content.matchAll(attachmentRegex)];
        
        for (const match of matches) {
            try {
                // Get attachment name from either wiki-link or markdown format
                let attachmentName = match[1] || match[3] || '';
                attachmentName = attachmentName.split('|')[0].trim();
                if (!attachmentName) continue;

                // Handle both absolute and relative paths
                let file = null;
                
                // Try getting the file directly first
                file = app.vault.getAbstractFileByPath(attachmentName);
                
                // If not found, try resolving relative to the note
                if (!file) {
                    file = app.metadataCache.getFirstLinkpathDest(attachmentName, notePath);
                }
                
                // If still not found, check in attachments folder
                if (!file) {
                    const attachmentFolder = app.vault.config.attachmentFolderPath || '';
                    if (attachmentFolder) {
                        const fullPath = `${attachmentFolder}/${attachmentName}`;
                        file = app.vault.getAbstractFileByPath(fullPath);
                    }
                }

                if (file && !file.children) { // Check that it's not a folder
                    const arrayBuffer = await app.vault.readBinary(file);
                    const base64 = this.arrayBufferToBase64(arrayBuffer);
                    attachments.push({
                        name: file.name,
                        type: file.extension,
                        size: arrayBuffer.byteLength,
                        data: base64,
                        path: file.path
                    });
                }
            } catch (error) {
                console.error(`Failed to process attachment: ${error.message}`);
            }
        }
        
        return attachments;
    }

    static arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    static async sendContent(app, webhookUrl, content, filename, notePath) {
        if (!this.validateUrl(webhookUrl)) {
            throw new Error('Invalid webhook URL format');
        }

        const { frontmatter, content: noteContent } = this.parseYamlFrontmatter(content);
        const attachments = await this.getAttachments(app, content, notePath);

        const payload = {
            ...frontmatter,
            content: noteContent,
            filename,
            timestamp: Date.now(),
            attachments
        };

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            throw new Error(`Failed to send webhook: ${error.message}`);
        }
    }
}

module.exports = { WebhookService };