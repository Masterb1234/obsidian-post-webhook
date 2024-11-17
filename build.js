const fs = require('fs');

const manifest = {
    "id": "obsidian-webhook",
    "name": "Webhook Sender",
    "version": "1.0.0",
    "minAppVersion": "0.12.0",
    "description": "Send notes to webhook",
    "author": "Your Name",
    "isDesktopOnly": false
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));