# Post Webhook Plugin

Send your Obsidian notes or selected text to any Webhook endpoint with YAML frontmatter support and attachment handling. Perfect for automating your note-taking workflow and integrating with external services.

## Features

- 📤 Send note content to multiple Webhook endpoints
- ✂️ Send selected text to Webhook endpoints
- 📋 YAML frontmatter parsing and inclusion in the Webhook payload
- 📎 Automatic attachment handling
- 📥 Response insertion into notes

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Post Webhook"
4. Install the plugin
5. Enable the plugin in your Community Plugins list

## Usage

### Setting Up Webhooks

1. Open plugin settings
2. Add one or more Webhook endpoints
3. Choose whether to append responses to your notes

### Sending Content

#### Full Notes
1. Open any note
2. Use the command palette (Ctrl/Cmd + P)
3. Search for "Send to [Webhook Name]"
4. Your note's content, frontmatter, and attachments will be sent

#### Selected Text
1. Select text in your note
2. Open command palette
3. Choose "Send Selection to [Webhook Name]"
4. The selected text will be sent and any response will be inserted after the selection

### YAML Frontmatter Support

The plugin automatically parses YAML frontmatter and includes it in the Webhook payload. Example note:

```yaml
---
title: My Note
tags: [Webhook, automation]
category: tech
---
Your note content here...

![attachment.png]
```

Will be sent as:

```json
{
  "title": "My Note",
  "tags": ["Webhook", "automation"],
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
- Converts them to Base64
- Includes them in the Webhook payload
- Supports images and other file types

### Response Handling

The plugin can automatically insert Webhook responses into your notes:

1. Enable "Attach Response" in webhook settings
2. When sending a note/selection, any response will be inserted:
   - For full notes: Appended at the bottom
   - For selections: Inserted after the selected text

## License

MIT License - feel free to use this plugin in any way you'd like.

---

Created by MasterB1234