import { getFrontMatterInfo, parseYaml } from 'obsidian';
import { WebhookPayload, VariableNote } from '../types';

export class PayloadService {
  static createPayload(
    content: string,
    filename: string,
    attachments: any[],
    selectedText?: string | null,
    variableNote?: VariableNote | null
  ): WebhookPayload {
    const info = getFrontMatterInfo(content);
    let payload: WebhookPayload;
    
    if (!info.exists) {
      payload = {
        content: selectedText || content,
        filename,
        timestamp: Date.now(),
        attachments
      };
    } else {
      const frontmatter = parseYaml(info.frontmatter);
      const noteContent = selectedText || content.slice(info.contentStart).trim();
      
      payload = {
        ...frontmatter,
        content: noteContent,
        filename,
        timestamp: Date.now(),
        attachments
      };
    }

    // Add variables from variable note if provided
    if (variableNote?.variables) {
      payload = {
        ...payload,
        ...variableNote.variables
      };
    }

    return payload;
  }
}