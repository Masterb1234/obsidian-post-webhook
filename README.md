# Post Webhook Plugin

Send your Obsidian notes or selected text to any Webhook endpoint with YAML frontmatter support and attachment handling. Perfect for automating your note-taking workflow and integrating with external services such as n8n, Make. com and Zapier.

## Features

- 📤 Send note content to multiple Webhook endpoints
- ✂️ Send selected text to Webhook endpoints
- 📋 YAML frontmatter and inline fields parsing and inclusion in the Webhook payload
- 📎 Automatic attachment handling
- 📥 Response insertion into notes
- 🔄 Support for adding other notes with context (such as prompts) for dynamic workflows

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
4. Configure attachment and context note options per Webhook

### Sending Content

#### Full Notes
1. Open any note
2. Use the command palette (Ctrl/Cmd + P)
3. Search for "Send to [Webhook Name]"
4. Your note's content, frontmatter, and attachments will be sent

#### Selected Text
1. Select text in your note 
2. Open command palette 
3. Choose "Send Selection to [Webhook Name]" (not available in preview mode)
4. The selected text will be sent and any response will be inserted after the selection

### Response Handling

You can configure how responses from the webhook are handled:
- **Append**: Add the response at the end of your note
- **New Note**: Create a new note with versioning (v1, v2, etc.)
- **Overwrite**: Replace the current note's content with the response
- **None**: Don't save the response

The handling mode can be set per webhook, with an option to ask every time.

### YAML Frontmatter Support

The plugin automatically parses YAML frontmatter and includes it in the Webhook payload. Example note:

```yaml
---
title: My Note
tags: [Webhook, automation]
category: tech
exclude-attachment: attachment1.mp3  # Exclude a single attachment
# OR exclude multiple attachments:
exclude-attachment:
  - image1.png
  - document.pdf
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

### Inline Fields Support

In addition to YAML frontmatter, you can use inline fields that will be included in the webhook payload:

```markdown
title:: My Document
status:: draft
tags:: [research, notes]

Your content here...
```

These fields will be automatically extracted and added to the payload when inline field processing is enabled for the Webhook.

### Attachment Support

The plugin automatically:
- Detects attachments referenced in your notes using the `![[filename]]` syntax
- Reads the attachment files
- Converts them to Base64
- Includes them in the Webhook payload
- Supports images and other file types
- Allows excluding specific attachments via YAML frontmatter

For Webhooks where attachments are not necessary or might exceed the endpoint's file size limits, you can enable the "Exclude Attachments" option in the Webhook settings. All attachments will be omitted from requests to this endpoint.

### Context Notes

Context notes enable you to create reusable content blocks that can be seamlessly integrated into your Webhook requests. This feature is particularly helpful for leveraging prompt templates stored in your Obsidian vault when interacting with AI models through Webhook data.

Example: To use context notes for AI prompting, create a note with the following structure:

```
---
post-webhook: true # Required to make this note available as a context block for Webhook payloads.
---
--user # can be any keyword
Your user prompt to send to an AI model.

--assistant # can be any keyword
Tell the model to adopt a specific tone or personality.

--system # can be any keyword
Set the model's behavior.

```

2. Enable "Include Context Note" for your Webhook
3. When sending content, you'll be prompted to select a context note
4. The parameters (separated by --keyword) will be included in the Webhook payload

## Use Cases

### Email Integration
Send emails directly from your Obsidian notes using n8n workflows. Write your email content in Obsidian, include recipients and subject in the frontmatter, and send it to your email workflow with a single command. [Template here](https://n8n.io/workflows/2591-send-emails-via-gmail-from-obsidian/)

### Smart Airtable Queries
Query your Airtable bases using natural language. Highlight a question in your note, send it to an n8n workflow that uses GPT to interpret your query, and get formatted Airtable data inserted directly into your note. [Template here](https://n8n.io/workflows/2615-get-airtable-data-via-ai-and-obsidian-notes/)

### Notes to Audio in Podcast Feed
Transform your Obsidian notes into an audio podcast feed. Select text from your notes, send it to an n8n workflow that converts it to speech, and automatically publish it to a podcast feed compatible with apps such as Podcast Republic or platforms like Apple Podcasts and Spotify. The workflow handles text-to-speech conversion, audio hosting, and RSS feed generation. [Template here](https://n8n.io/workflows/2699-obsidian-notes-read-aloud-using-ai-available-as-a-podcast-feed/))

## License

MIT License - feel free to use this plugin in any way you'd like.

---

Created by MasterB1234