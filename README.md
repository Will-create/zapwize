# Zapwize

A lightweight Node.js SDK and CLI for sending WhatsApp messages, media, and managing your WhatsApp integration via Zapwize API.

[![NPM Version](https://img.shields.io/npm/v/zapwize.svg)](https://www.npmjs.com/package/zapwize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Send text messages to any WhatsApp number
- Send media files (images, videos, audio, documents)
- Send locations, contacts, polls, and reactions
- Forward and pin messages
- Real-time message reception via WebSocket
- Event-based architecture for handling messages and connection states
- Automatic reconnection with exponential backoff
- WhatsApp number validation
- Military-grade error handling and connection resilience
- Simple API key authentication
- CLI for managing your Zapwize account and WhatsApp numbers

## Installation

```bash
# Install as a dependency in your project
npm install zapwize

# Or install globally to use the CLI
npm install -g zapwize
```

## SDK Quick Start

```javascript
const Zapwize = require('zapwize');

const zap = new Zapwize({ 
  apiKey: 'your_api_key_here' 
});

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

// Handle disconnections
zap.on('disconnected', () => {
  console.log('Disconnected from Zapwize');
});

// Handle reconnections
zap.on('connected', () => {
  console.log('Reconnected to Zapwize');
});
```
# Zapwize

A lightweight Node.js SDK and CLI for sending WhatsApp messages, media, and managing your WhatsApp integration via Zapwize API.

[![NPM Version](https://img.shields.io/npm/v/zapwize.svg)](https://www.npmjs.com/package/zapwize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Send messages to any WhatsApp number
- Send media (images, videos, documents)
- Real-time message reception via WebSocket
- Event-based architecture for handling messages and connection states
- Automatic reconnection handling
- Simple API key authentication
- CLI for managing your Zapwize account and WhatsApp numbers

## Installation

```bash
# Install as a dependency in your project
npm install zapwize

# Or install globally to use the CLI
npm install -g zapwize
```

## SDK Quick Start

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

## Getting Your API Key

To use the Zapwize SDK, you'll need to obtain an API key. Here are two ways to get one:

### Method 1: Using the Web Interface

1. **Create an Account**: Visit [https://zapwize.com/](https://zapwize.com/) and sign up for a new account.

2. **Add Your WhatsApp Number**: After logging in, you'll need to add and verify your WhatsApp number to the platform.

3. **Generate API Key**: Once your number is verified, navigate to the API section in your dashboard.

4. **Copy Your API Key**: Your unique API key will be displayed. Copy this key as you'll need it to initialize the Zapwize SDK.

### Method 2: Using the Zapwize CLI

If you've installed the Zapwize CLI globally, you can use it to manage your API keys:

1. **Login to Your Account**:
   ```bash
   zapwize login
   ```

2. **Link Your WhatsApp Number** (if you haven't already):
   ```bash
   zapwize link
   ```
   This will display a QR code in your terminal that you can scan with your WhatsApp app.

3. **Create an API Key**:
   ```bash
   zapwize create-key YOUR_PHONE_NUMBER
   ```
   Replace `YOUR_PHONE_NUMBER` with your actual WhatsApp number.

4. **Save Your API Key**: The CLI will display your new API key. Save it securely as it will only be shown once.

Remember to keep your API key secure and never share it publicly. Each API key is linked to your specific WhatsApp number and account.

        
## SDK API Reference

### Check WhatsApp Number
Check if a phone number is a valid WhatsApp number

```javascript
await zap.isWhatsAppNumber(phone);
```

- `phone`: Phone number to check (e.g., '22612345678')
- Returns: `true` if the number is a valid WhatsApp number, `false` otherwise
- Note: This function doesn't require an API key

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


## CLI Usage

Zapwize includes a powerful and interactive command-line interface (CLI) to manage your account, WhatsApp numbers, API keys, and more.

### Installation

First, ensure you have the CLI installed globally:
```bash
npm install -g zapwize
```

### Authentication

Before using most commands, you need to log in to your Zapwize account.

**`zapwize login`**

This command will open a browser window for you to securely authenticate. Once you've logged in, your session will be stored locally.
```bash
zapwize login
```

**`zapwize logout`**

Logs you out of the current session.
```bash
zapwize logout
```

**`zapwize whoami`**

Displays information about the currently logged-in user.
```bash
zapwize whoami
```

### Managing WhatsApp Numbers

The `numbers` command is your primary tool for managing connected WhatsApp numbers.

**`zapwize numbers:list`**

Lists all of your connected WhatsApp numbers with their current status.
```bash
zapwize numbers:list
```

**`zapwize numbers:create`**

Interactively prompts you to add a new WhatsApp number. You'll be asked for a name, the phone number, an optional webhook URL, and the connection method (QR code or pairing code).
```bash
zapwize numbers:create
```

**`zapwize numbers:delete`**

Presents a list of your numbers and allows you to select one to delete.
```bash
zapwize numbers:delete
```

**`zapwize numbers:scan`**

If a number is disconnected, this command lets you select it and generate a new QR code to re-link it.
```bash
zapwize numbers:scan
```

**`zapwize numbers:link`**

Similar to `scan`, but generates a pairing code to re-link a disconnected number.
```bash
zapwize numbers:link
```

### Managing API Keys

Manage the API keys used to authenticate with the Zapwize SDK.

**`zapwize apikeys:list`**

Lists all of your existing API keys.
```bash
zapwize apikeys:list
```

**`zapwize apikeys:create`**

Prompts you to create a new API key by giving it a name. The new key will be displayed in the terminal.
```bash
zapwize apikeys:create
```

**`zapwize apikeys:delete`**

Presents a list of your API keys and allows you to select one to delete.
```bash
zapwize apikeys:delete
```

### AI and Bots

Manage your AI-powered features. These commands will redirect you to the web dashboard.

**`zapwize ai:bots`**
Opens your web dashboard to the AI bots management page.
```bash
zapwize ai:bots
```

**`zapwize ai:integrations`**
Opens your web dashboard to the AI integrations page.
```bash
zapwize ai:integrations
```

**`zapwize ai:settings`**
Opens your web dashboard to the AI settings page.
```bash
zapwize ai:settings
```

### Billing and Subscriptions

Manage your billing information and subscription plans. These commands will redirect you to the web dashboard.

**`zapwize billing:plans`**
Opens your web dashboard to the subscription plans page.
```bash
zapwize billing:plans
```

**`zapwize billing:usage`**
Opens your web dashboard to view your current usage.
```bash
zapwize billing:usage
```

**`zapwize billing:history`**
Opens your web dashboard to view your billing history.
```bash
zapwize billing:history
```

## Getting Your API Key

To use the Zapwize SDK, you'll need an API key.

1. **Login to Your Account**:
   ```bash
   zapwize login
   ```

2. **Link Your WhatsApp Number**:
   ```bash
   zapwize numbers:create
   ```

3. **Create an API Key**:
   ```bash
   zapwize apikeys:create
   ```

4. **Save Your API Key**: The CLI will display your new API key. Save it securely as it will only be shown once.

Remember to keep your API key secure and never share it publicly.

## License

MIT © [Zapwize](https://zapwize.com)

## Support

- 📧 Email: support@zapwize.com
- 🌐 Website: https://zapwize.com
- 📚 Documentation: https://docs.zapwize.com