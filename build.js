const fs = require('fs');

const manifest = {
    "id": "post-webhook",
    "name": "Webhook Sender",
    "version": "1.0.0",
    "minAppVersion": "1.5.7",
    "description": "Send notes to webhook",
    "author": "Your Name",
    "isDesktopOnly": false
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));