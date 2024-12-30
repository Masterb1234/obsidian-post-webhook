import { getFrontMatterInfo, parseYaml } from 'obsidian';

export class YAMLParser {
  static async getExcludedAttachments(content: string): Promise<string[]> {
    try {
      const info = getFrontMatterInfo(content);
      if (!info.exists || !info.frontmatter) {
        return [];
      }

      // Try to parse YAML frontmatter
      let frontmatter;
      try {
        frontmatter = parseYaml(info.frontmatter);
      } catch (yamlError) {
        console.warn('Invalid YAML frontmatter:', yamlError);
        return [];
      }

      // Handle null or undefined frontmatter
      if (!frontmatter || typeof frontmatter !== 'object') {
        return [];
      }

      const excludeAttachment = frontmatter['exclude-attachment'];

      // Handle different types of exclude-attachment values
      if (!excludeAttachment) {
        return [];
      }

      if (typeof excludeAttachment === 'string') {
        return [excludeAttachment];
      }

      if (Array.isArray(excludeAttachment)) {
        return excludeAttachment
          .filter(item => typeof item === 'string')
          .map(item => item.trim())
          .filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error('Error processing frontmatter:', error);
      return [];
    }
  }

  static isValidYaml(content: string): boolean {
    try {
      const info = getFrontMatterInfo(content);
      if (!info.exists || !info.frontmatter) {
        return true; // No frontmatter is considered valid
      }

      parseYaml(info.frontmatter);
      return true;
    } catch (error) {
      return false;
    }
  }
}