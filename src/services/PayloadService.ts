import { getFrontMatterInfo, parseYaml } from 'obsidian';
import { WebhookPayload, VariableNote } from '../types';

export class PayloadService {
  static createPayload(
    content: string,
    filename: string,
    filepath: string,
    attachments: any[],
    selectedText?: string | null,
    variableNote?: VariableNote | null,
    processInlineFields: boolean = false
  ): WebhookPayload {
    const info = getFrontMatterInfo(content);
    let payload: WebhookPayload;
    
    if (!info.exists) {
      payload = {
        content: selectedText || content,
        filename,
        filepath,
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
        filepath,
        timestamp: Date.now(),
        attachments
      };
    }

    // Process inline fields if enabled
    if (processInlineFields) {
      const inlineFields = this.extractInlineFields(selectedText || content);
      payload = {
        ...payload,
        ...inlineFields
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

  private static extractInlineFields(content: string): Record<string, string | string[]> {
    const fields: Record<string, string | string[]> = {};
    const inlineFieldRegex = /^([^:\n]+)::([^\n]+)$/gm;
    
    let match;
    while ((match = inlineFieldRegex.exec(content)) !== null) {
      const [, key, value] = match;
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      // Check if the value is wrapped in square brackets
      if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
        // Parse array value
        const arrayValue = trimmedValue
          .slice(1, -1) // Remove brackets
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        // If the field already exists and is an array, append to it
        if (Array.isArray(fields[trimmedKey])) {
          (fields[trimmedKey] as string[]).push(...arrayValue);
        } else if (fields[trimmedKey]) {
          // If the field exists but isn't an array, convert it to an array
          fields[trimmedKey] = [fields[trimmedKey] as string, ...arrayValue];
        } else {
          // New array field
          fields[trimmedKey] = arrayValue;
        }
      } else {
        // Handle single value
        if (fields[trimmedKey]) {
          // If the field already exists, convert it to an array
          if (Array.isArray(fields[trimmedKey])) {
            (fields[trimmedKey] as string[]).push(trimmedValue);
          } else {
            fields[trimmedKey] = [fields[trimmedKey] as string, trimmedValue];
          }
        } else {
          // New single value field
          fields[trimmedKey] = trimmedValue;
        }
      }
    }

    return fields;
  }
}