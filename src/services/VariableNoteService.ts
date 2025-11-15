import { TFile, Vault, MetadataCache } from 'obsidian';
import { VariableNote } from '../types';

export class VariableNoteService {
  static async findVariableNotes(vault: Vault, metadataCache: MetadataCache): Promise<VariableNote[]> {
    const notes: VariableNote[] = [];
    
    const markdownFiles = vault.getMarkdownFiles();
    for (const file of markdownFiles) {
      const metadata = metadataCache.getFileCache(file);
      const frontmatter = metadata?.frontmatter;
      
      const postWebhookValue = frontmatter?.['post-webhook'];
      if (postWebhookValue === true || postWebhookValue === 'true') {
        const content = await vault.read(file);
        const variables = this.parseVariables(content);
        
        notes.push({
          title: file.basename,
          path: file.path,
          variables
        });
      }
    }
    
    return notes;
  }

  private static parseVariables(content: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const lines = content.split('\n');
    
    let currentKey: string | null = null;
    let currentValue: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^--([\w_]+)/);
      
      if (match) {
        // Save previous variable if exists
        if (currentKey) {
          variables[currentKey] = currentValue.join('\n').trim();
          currentValue = [];
        }
        currentKey = match[1];
      } else if (currentKey) {
        currentValue.push(line);
      }
    }
    
    // Save last variable
    if (currentKey) {
      variables[currentKey] = currentValue.join('\n').trim();
    }
    
    return variables;
  }
}