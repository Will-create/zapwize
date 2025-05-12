# Zapwize

A lightweight Node.js SDK for sending WhatsApp messages, media, and receiving real-time updates via WebSocket connection.

[![NPM Version](https://img.shields.io/npm/v/zapwize.svg)](https://www.npmjs.com/package/zapwize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Send messages to any WhatsApp number
- Send media (images, videos, documents)
- Real-time message reception via WebSocket
- Event-based architecture for handling messages and connection states
- Automatic reconnection handling
- Simple API key authentication

## Installation

```bash
npm install zapwize
```

## Quick Start

```javascript
const Zapwize = require('zapwize');
const zap = new Zapwize({ apiKey: 'your_api_key_here' });

// Listen for connection ready event
zap.on('ready', (data) => {
  console.log('Connected to Zapwize!', data);
  
  // Send a text message
  zap.sendMessage('22600000000', 'Hello from Zapwize!');
});

// Listen for incoming messages
zap.on('message', (message) => {
  console.log('New message received:', message);
  
  // Reply to the message
  if (message.from) {
    const phone = message.from.number;
    zap.sendMessage(phone, 'Thanks for your message!');
  }
});

// Handle errors
zap.on('error', (error) => {
  console.error('Error:', error);
});
```



          
# Getting Your API Key

To use the Zapwize SDK, you'll need to obtain an API key. Here's how to get one:

1. **Create an Account**: Visit [https://app.zapwize.com/](https://app.zapwize.com/) and sign up for a new account.

2. **Add Your WhatsApp Number**: After logging in, you'll need to add and verify your WhatsApp number to the platform.

3. **Generate API Key**: Once your number is verified, navigate to the API section in your dashboard.

4. **Copy Your API Key**: Your unique API key will be displayed. Copy this key as you'll need it to initialize the Zapwize SDK.

Remember to keep your API key secure and never share it publicly. Each API key is linked to your specific WhatsApp number and account.

        
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
  - `content`: Base64-encoded media content
  - `caption`: Optional text caption
  - `type`: Optional ('url' or 'base64')

### Event Listeners

```javascript
// Connection established
zap.on('ready', (data) => {
  console.log('Connected!', data);
});

// New message received
zap.on('message', (message) => {
  console.log('Message:', message);
});

// Error occurred
zap.on('error', (error) => {
  console.error('Error:', error);
});

// Disconnected from server
zap.on('disconnected', () => {
  console.log('Disconnected from server');
});
```

### Disconnect

```javascript
zap.disconnect();
```

## Supported Media Types

| Type      | Extensions                            |
|-----------|---------------------------------------|
| Images    | .jpg, .jpeg, .png, .gif, .webp       |
| Videos    | .mp4, .3gp, .avi                     |
| Audio     | .mp3, .ogg, .m4a                     |
| Documents | .pdf, .doc, .docx, .xls, .xlsx, .txt |
| Stickers  | .webp                                |

## Authentication

The SDK uses a two-step authentication process:
1. Initial REST API call with your API key to obtain server information and token
2. WebSocket connection using the obtained token

All you need to provide is your API key:

```javascript
const zap = new Zapwize({ apiKey: 'YOUR_API_KEY' });
```

## Connection Flow

1. The SDK initializes with your API key
2. Makes a REST API call to get server information and token
3. Establishes a WebSocket connection for real-time messaging
4. Emits 'ready' event when connection is established
5. Automatically handles reconnection if connection is lost

## Error Handling

The SDK emits 'error' events with detailed information:

```javascript
zap.on('error', (error) => {
  console.error('Error type:', error.type);
  console.error('Error details:', error.error);
});
```

Error types include:
- 'initialization': Issues during initial setup
- 'websocket': Connection problems
- 'message_parsing': Problems parsing incoming messages

## License

MIT

