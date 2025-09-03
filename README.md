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

## Getting Your API Key

To use the Zapwize SDK, you'll need to obtain an API key. Here are two ways to get one:

### Method 1: Using the Web Interface

1. **Create an Account**: Visit [https://zapwize.com/](https://zapwize.com/) and sign up for a new account.

2. **Add Your WhatsApp Number**: After logging in, you'll need to add and verify your WhatsApp number to the platform.

3. **Generate API Key**: Once your number is verified, navigate to the API section in your dashboard.

4. **Copy Your API Key**: Your unique API key will be displayed. Copy this key as you'll need it to initialize the Zapwize SDK.

### Method 2: Using the Zapwize CLI

If you've installed the Zapwize CLI globally (via ``), you can use it to manage your API keys:

1. **Login to Your Account**:
   ```bash
   zapwize login
   ```

2. **Link Your WhatsApp Number** (if you haven't already):
   ```bash
   zapwize numbers link
   ```
   - This will prompt you to select linking method: code and qrcode.
   - Then a prompt to enter a name for your integration
   - Then a prompt to enter webhook. That one is optional. But you can still add it in your dashboard in

   If Qrcode: it will display QR code in your terminal that you can scan with your WhatsApp app.
   If Code: then it will display Confirmation Code and by the time you see it there will be a notification from whatsapp in you mobile phone.  

3. **Create an API Key**:
```bash
zapwize apikeys create
```
Interact with the cli to fill to connect to generate an api key for your app.

4. **Save Your API Key**: The CLI will display your new API key. Save it securely as it may only be shown once.

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



## on(\'message\') data structures

When you listen for the `message` event, you will receive a data object with a structure that varies depending on the type of message. Here are the possible message types and their corresponding data structures:

### Presence

`presence` messages indicate a user\'s status (e.g., composing, available, recording).

```json
{
  "id": "22656920671@s.whatsapp.net-1756868499107",
  "content": {
    "type": "presence",
    "body": { "presence": "composing", "timestamp": 1756868499107 }
  },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "presence",
  "isgroup": false,
  "istag": false,
  "from": "22656920671",
  "group": null,
  "isviewonce": false
}
```

### Text

`text` messages contain a simple text string.

```json
{
  "id": "6232CC122DE27100F01B8E2C11CB4CA2",
  "content": "Text message",
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "text",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Document

`document` messages contain a file attachment.

```json
{
  "id": "75BAF95FCD98B395EB8C4B421792F478",
  "content": {
    "name": "104a16atbd4n374o7gpxf6311svnq55ujqk.pdf",
    "size": 6328437,
    "ext": "pdf",
    "custom": { "type": "document", "fromstatus": false },
    "type": "application/pdf",
    "date": "2025-09-03T03:06:18.077Z",
    "expire": "2025-09-06T03:06:18.077Z",
    "id": "1qzyt003ga51d",
    "url": "https://server0.zapwize.com/download/22656920671_1qzyt003ga51d-1xgx27p.pdf"
  },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "document",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Sticker

`sticker` messages contain a sticker.

```json
{
  "id": "16266C5C390179394B24D07D825505CB",
  "content": {
    "name": "3oo121dq51u0n15i41bpass1x3xj8ptu8bm.webp",
    "size": 12946,
    "ext": "webp",
    "custom": { "type": "sticker", "fromstatus": false },
    "type": "image/webp",
    "date": "2025-09-03T03:06:31.036Z",
    "expire": "2025-09-06T03:06:31.036Z",
    "id": "1qzyu001ga51d",
    "url": "https://server0.zapwize.com/download/22656920671_1qzyu001ga51d-1cy2yg.webp"
  },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "sticker",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Video

`video` messages contain a video file.

```json
{
  "id": "9F35AE5AE17F9BFC7D7A8E97A08D2387",
  "content": {
    "name": "98719r817pv18h0122016td1ake9qjx8yfv.mp4",
    "size": 35051,
    "ext": "mp4",
    "custom": { "type": "video", "fromstatus": false },
    "type": "video/mp4",
    "date": "2025-09-03T03:06:48.019Z",
    "expire": "2025-09-06T03:06:48.019Z",
    "id": "1qzyu002ga50d",
    "url": "https://server0.zapwize.com/download/22656920671_1qzyu002ga50d-1pt8xdk.mp4"
  },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "video",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Image

`image` messages contain an image file.

```json
{
  "id": "3C7B923801F71B2920C163C1CE353705",
  "content": {
    "name": "gg83fori1ib43w5v9n10dv1dxq14su19ys5.jpg",
    "size": 18245,
    "ext": "jpg",
    "custom": { "type": "image", "fromstatus": false, "caption": null },
    "type": "image/jpeg",
    "width": 525,
    "height": 1080,
    "date": "2025-09-03T03:07:08.140Z",
    "expire": "2025-09-06T03:07:08.140Z",
    "id": "1qzyu003ga51d",
    "url": "https://server0.zapwize.com/download/22656920671_1qzyu003ga51d-1ji53jq.jpg"
  },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "image",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Voice

`voice` messages contain a voice recording.

```json
{
  "id": "B29EA211EC2F62BDD83B2B3083DC6DBD",
  "content": {
    "name": "pm9wlgc24175vdtoun90gs7e96u199a16sj.ogg",
    "size": 5974,
    "ext": "ogg",
    "custom": { "type": "voice" },
    "type": "application/ogg",
    "date": "2025-09-03T03:07:40.664Z",
    "expire": "2025-09-06T03:07:40.664Z",
    "id": "1qzyv001ga51d",
    "url": "https://server0.zapwize.com/download/22656920671_1qzyv001ga51d-1mfa69l.ogg"
  },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "voice",
  "isgroup": false,
  "istag": false,
  "from": {
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "fromMe": false,
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Poll

`poll` messages contain a poll with options.

```json
{
  "id": "ABB6DC080122A5160CE5BCBD695861C7",
  "content": "{\"name\":\"Blue or red pill?\",\"options\":[{\"optionName\":\"Blue\"},{\"optionName\":\"Red\"}],\"selectableOptionsCount\":0}",
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "poll",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Location

`location` messages contain geographic coordinates.

```json
{
  "id": "13D6D1BDDA5C6A0C8CF72D31CEC0956F",
  "content": "\"12.4239463, -1.525469\"",
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "location",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Contact

`contact` messages contain contact information in vCard format.

```json
{
  "id": "7ADB6963E30719F1D8E0FEB26AD015AA",
  "content": "BEGIN:VCARD\nVERSION:3.0\nN:;@Ouattara;;;\nFN:@Ouattara\nitem1.TEL;waid=22676605143:+226 76 60 51 43\nitem1.X-ABLabel:Other\nEND:VCARD",
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "contact",
  "isgroup": false,
  "istag": false,
  "from": {
    "fromMe": false,
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```

### Reaction

`reaction` messages contain a reaction to a previous message.

```json
{
  "id": "3EB099A22195E701665C5F",
  "content": { "text": "❤️", "msgid": "3EB099A22195E701665C5F", "ts": "1756868965989" },
  "number": "22656920671",
  "chatid": "22656920671@s.whatsapp.net",
  "type": "reaction",
  "isgroup": false,
  "istag": false,
  "from": {
    "id": "22656920671@s.whatsapp.net",
    "number": "22656920671",
    "pushname": "Louis Bertson",
    "fromMe": false,
    "countrycode": "226"
  },
  "group": { "id": "", "name": "" },
  "isviewonce": false
}
```
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

To use the Zapwize SDK, you\'ll need an API key.

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