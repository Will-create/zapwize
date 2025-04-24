
# Zapwize

A lightweight Node.js SDK for sending WhatsApp messages, media, and remote commands via Zapwize API.

[![NPM Version](https://img.shields.io/npm/v/zapwize.svg)](https://www.npmjs.com/package/zapwize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Send messages to any WhatsApp number
- Send media (images, videos, documents)
- Control WhatsApp sessions via RPC
- Simple API key authentication
- No phone number management needed

## Installation

```bash
npm install zapwize
```

## Quick Start

```javascript
const Zapwize = require('zapwize');
const zap = new Zapwize({ apiKey: 'your_api_key_here' });

// Send a text message
await zap.sendMessage('22600000000', 'Hello from Zapwize!');

// Send an image with caption
await zap.sendMedia('22600000000', {
  url: 'https://example.com/image.jpg',
  caption: 'Check this out!'
});

// Check WhatsApp connection state
const state = await zap.rpc({ topic: 'state' });
console.log(state); // { content: 'CONNECTED' }
```

## API Reference

### Constructor

```javascript
const zap = new Zapwize({ apiKey: 'YOUR_API_KEY' });
```

### Send Message

```javascript
await zap.sendMessage(phone, message);
```

- `phone`: Recipient's phone number (e.g., '22612345678')
- `message`: Text message to send

### Send Media

```javascript
await zap.sendMedia(phone, mediaData);
```

- `phone`: Recipient's phone number
- `mediaData`: Object containing:
  - `url`: Public URL to media file **OR**
  - `base64`: Base64-encoded media content
  - `caption`: Optional text caption
  - `type`: Optional ('url' or 'base64')

### RPC Commands

```javascript
await zap.rpc({ topic: command });
```

Available commands:
- `state`: Get WhatsApp connection state
- `logout`: Log out current session
- `ping`: Health check
- `test`: Echo test

## Supported Media Types

| Type      | Extensions                            |
|-----------|---------------------------------------|
| Images    | .jpg, .jpeg, .png, .gif, .webp       |
| Videos    | .mp4, .3gp, .avi                     |
| Audio     | .mp3, .ogg, .m4a                     |
| Documents | .pdf, .doc, .docx, .xls, .xlsx, .txt |
| Stickers  | .webp                                |

## Authentication

All requests are authenticated using your API key:

```http
Authorization: Bearer YOUR_API_KEY
```

## Coming Soon

- QR Code Scan via SDK
- Webhook registration
- Event listeners for incoming messages
- TypeScript support

## License

MIT

## Support

- Documentation: [https://zapwize.com/docs](https://zapwize.com/docs)
- Issues: [GitHub Issues](https://github.com/will-create/zapwize/issues)
```
