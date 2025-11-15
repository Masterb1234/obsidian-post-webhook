import { getFrontMatterInfo, parseYaml, TFile, App } from 'obsidian';
import { WebhookPayload, VariableNote } from '../types';

export class PayloadService {
  static createPayload(
    app: App,
    content: string,
    filename: string,
    filepath: string,
    attachments: any[],
    file: TFile,
    selectedText?: string | null,
    variableNote?: VariableNote | null,
    processInlineFields: boolean = false,
    renderedHtml?: string,
    convertInternalLinksToObsidianURIs: boolean = false,
    includeRawContent: boolean = false
  ): WebhookPayload {
    const info = getFrontMatterInfo(content);
    let payload: WebhookPayload;

    if (includeRawContent) {
      payload = {
        content: selectedText || content,
        filename,
        filepath,
        timestamp: Date.now(),
        createdAt: file.stat.ctime,
        modifiedAt: file.stat.mtime,
        attachments
      };
    } else if (!info.exists) {
      payload = {
        content: selectedText || content,
        filename,
        filepath,
        timestamp: Date.now(),
        createdAt: file.stat.ctime,
        modifiedAt: file.stat.mtime,
        attachments
      };
    } else {
      const frontmatter = parseYaml(info.frontmatter);
      const noteContent = selectedText || content.slice(info.contentStart).trim();

      payload = {
        ...frontmatter,
        content: noteContent,
        filename,
        filepath,
        timestamp: Date.now(),
        createdAt: file.stat.ctime,
        modifiedAt: file.stat.mtime,
        attachments
      };
    }

    if (convertInternalLinksToObsidianURIs) {
      payload.content = this.convertInternalLinks(app, payload.content, file.path);
    }

    if (processInlineFields) {
      const inlineFields = this.extractInlineFields(selectedText || content);
      payload = {
        ...payload,
        ...inlineFields
      };
    }

    if (variableNote?.variables) {
      payload = {
        ...payload,
        ...variableNote.variables
      };
    }

    if (renderedHtml) {
      payload.renderedHtml = renderedHtml;
    }

    return payload;
  }

  private static convertInternalLinks(app: App, content: string, sourcePath: string): string {
    const wikiLinkRegex = /(\!)?\[\[([^\]|]+)(?:\|(.+?))?\]\]/g;

    return content.replace(wikiLinkRegex, (match, isEmbedChar, link, alias) => {
      if (isEmbedChar) {
        return match;
      }

      const file = app.metadataCache.getFirstLinkpathDest(link, sourcePath);
      if (file) {
        const vaultName = app.vault.getName();
        const obsidianUri = `obsidian://vault/${encodeURIComponent(vaultName)}/${encodeURIComponent(file.path)}`;
        const displayText = alias || link;
        return `[${displayText}](${obsidianUri})`;
      }
      return match;
    });
  }

  private static extractInlineFields(content: string): Record<string, string | string[]> {
    const fields: Record<string, string | string[]> = {};
    const inlineFieldRegex = /^([^:\n]+)::([^\n]+)$/gm;
    
    let match;
    while ((match = inlineFieldRegex.exec(content)) !== null) {
      const [, key, value] = match;
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
        const arrayValue = trimmedValue
          .slice(1, -1)
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        if (Array.isArray(fields[trimmedKey])) {
          (fields[trimmedKey] as string[]).push(...arrayValue);
        } else if (fields[trimmedKey]) {
          fields[trimmedKey] = [fields[trimmedKey] as string, ...arrayValue];
        } else {
          fields[trimmedKey] = arrayValue;
        }
      } else {
        if (fields[trimmedKey]) {
          if (Array.isArray(fields[trimmedKey])) {
            (fields[trimmedKey] as string[]).push(trimmedValue);
          } else {
            fields[trimmedKey] = [fields[trimmedKey] as string, trimmedValue];
          }
        } else {
          fields[trimmedKey] = trimmedValue;
        }
      }
    }

    return fields;
  }
}