const { requestUrl, arrayBufferToBase64, parseYaml, getFrontMatterInfo } = require('obsidian');

class WebhookService {
    static validateUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        } catch {
            return false;
        }
    }

    static parseYamlFrontmatter(content) {
        const info = getFrontMatterInfo(content);
        if (!info.exists) {
            return {
                frontmatter: {},
                content
            };
        }
        const frontmatter = parseYaml(info.frontmatter);
        const contentWithoutFrontmatter = content.slice(info.contentStart);
        return {
            frontmatter,
            content: contentWithoutFrontmatter
        };
    }

    static async getAttachments(app, file) {
        const attachments = [];
        const cache = app.metadataCache.getFileCache(file);
        
        if (!cache) {
            return attachments;
        }

        const processFile = async (linkedFile) => {
            if (linkedFile && !linkedFile.children) {
                const buffer = await app.vault.readBinary(linkedFile);
                const base64 = arrayBufferToBase64(buffer);
                const mimeType = this.getMimeType(linkedFile.extension);
                
                attachments.push({
                    name: linkedFile.name,
                    type: linkedFile.extension,
                    mimeType: mimeType,
                    size: buffer.byteLength,
                    data: `data:${mimeType};base64,${base64}`,
                    path: linkedFile.path
                });
            }
        };

        if (cache.embeds) {
            for (const embed of cache.embeds) {
                if (embed.link) {
                    const linkedFile = app.metadataCache.getFirstLinkpathDest(embed.link, file.path);
                    if (linkedFile) {
                        await processFile(linkedFile);
                    }
                }
            }
        }

        if (cache.links) {
            for (const link of cache.links) {
                if (link.link) {
                    const linkedFile = app.metadataCache.getFirstLinkpathDest(link.link, file.path);
                    if (linkedFile) {
                        await processFile(linkedFile);
                    }
                }
            }
        }

        return attachments;
    }

    static getMimeType(extension) {
        const mimeTypes = {
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
        
        return mimeTypes[extension?.toLowerCase()] || 'application/octet-stream';
    }

    static async sendContent(app, webhookUrl, content, filename, file) {
        if (!webhookUrl) {
            throw new Error('Webhook URL is required');
        }

        if (!this.validateUrl(webhookUrl)) {
            throw new Error('Invalid Webhook URL. Must be a valid HTTP or HTTPS URL');
        }

        try {
            const cache = app.metadataCache.getFileCache(file);
            let frontmatter = {};
            let noteContent = content;

            if (cache && cache.frontmatter) {
                frontmatter = parseYaml(cache.frontmatter);
                const contentStart = cache.frontmatterPosition.end.offset + 1;
                noteContent = content.slice(contentStart).trim();
            }

            const attachments = await this.getAttachments(app, file);

            const payload = {
                ...frontmatter,
                content: noteContent,
                filename,
                timestamp: Date.now(),
                attachments
            };

            const response = await requestUrl({
                url: webhookUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status >= 400) {
                throw new Error(`Request failed: ${response.status}`);
            }

            return true;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to the Webhook URL. Please check your internet connection and the URL.');
            }
            throw new Error(`Failed to send Webhook: ${error.message}`);
        }
    }
}

module.exports = WebhookService;