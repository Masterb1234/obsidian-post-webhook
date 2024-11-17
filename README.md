# Obsidian Post Webhook Plugin

Send your Obsidian notes to any webhook endpoint with YAML frontmatter support and attachment handling. Perfect for automating your note-taking workflow and integrating with external services.

## Features

- 📤 Send note content to any webhook endpoint
- 📋 YAML frontmatter parsing and inclusion in the webhook payload
- 📎 Automatic attachment handling (images and files)
- ⚡ Quick access through command palette
- ⚙️ Simple configuration with webhook URL
- 🔍 Detailed error reporting
- 🧪 Built-in webhook testing functionality

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Post Webhook"
4. Install the plugin
5. Enable the plugin in your Community Plugins list

## Usage

1. Set your webhook URL in the plugin settings
2. Open any note
3. Use the command palette (Ctrl/Cmd + P) and search for "Send to Webhook"
4. Your note's content, frontmatter, and attachments will be sent to the configured webhook

### YAML Frontmatter Support

The plugin automatically parses YAML frontmatter and includes it in the webhook payload. Example note:

```yaml
---
title: My Note
tags: [webhook, automation]
category: tech
---
Your note content here...

![attachment.png]
```

Will be sent as:

```json
{
  "title": "My Note",
  "tags": ["webhook", "automation"],
  "category": "tech",
  "content": "Your note content here...\n\n![attachment.png]",
  "filename": "note.md",
  "timestamp": 1234567890,
  "attachments": [
    {
      "name": "attachment.png",
      "type": "png",
      "size": 12345,
      "data": "base64_encoded_data..."
    }
  ]
}
```

### Attachment Support

The plugin automatically:
- Detects attachments referenced in your notes using the `![[filename]]` syntax
- Reads the attachment files
- Converts them to base64
- Includes them in the webhook payload
- Supports images and other file types

## Development

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev` to start compilation in watch mode
4. Copy the `main.js`, `manifest.json`, and `styles.css` (if you have any) to your Obsidian plugins folder

## License

MIT License - feel free to use this plugin in any way you'd like.

## Support

If you encounter any issues or have feature requests, please file them in the GitHub issues section.

---

Created by MasterB1234