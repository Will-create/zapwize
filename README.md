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

## API Reference

### Constructor

```javascript
const zap = new Zapwize({
  apiKey: 'your_api_key_here'
});
```

**Parameters:**
- `apiKey` (string, required): Your Zapwize API key

### Text Messages

#### `sendMessage(phone, message, options)`

Send a text message to a WhatsApp number.

```javascript
// Basic text message
await zap.sendMessage('22600000000', 'Hello World!');

// With mentions
await zap.sendMessage('22600000000', 'Hello @user!', {
  mentions: ['22611111111']
});

// Reply to a message
await zap.sendMessage('22600000000', 'This is a reply', {
  quoted: messageKey
});
```

**Parameters:**
- `phone` (string): Target phone number
- `message` (string): Message content
- `options` (object, optional):
  - `mentions` (array): Array of phone numbers to mention
  - `quoted` (object): Message key to reply to

### Media Messages

#### `sendImage(phone, media, options)`

Send an image file.

```javascript
// Send image from URL
await zap.sendImage('22600000000', {
  url: 'https://example.com/image.jpg'
}, {
  caption: 'Check out this image!'
});

// Send image from base64
await zap.sendImage('22600000000', {
  content: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...'
}, {
  caption: 'Image from base64',
  viewOnce: true
});
```

#### `sendVideo(phone, media, options)`

Send a video file.

```javascript
// Send video from URL
await zap.sendVideo('22600000000', {
  url: 'https://example.com/video.mp4'
}, {
  caption: 'Check out this video!',
  gif: false,
  ptv: false
});

// Send video as GIF
await zap.sendVideo('22600000000', {
  url: 'https://example.com/animation.mp4'
}, {
  gif: true
});
```

#### `sendAudio(phone, media, options)`

Send an audio file.

```javascript
// Send audio from URL
await zap.sendAudio('22600000000', {
  url: 'https://example.com/audio.mp3'
});

// Send audio from base64
await zap.sendAudio('22600000000', {
  content: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAA...'
});
```

#### `sendDocument(phone, media, options)`

Send a document file.

```javascript
// Send document from URL
await zap.sendDocument('22600000000', {
  url: 'https://example.com/document.pdf'
}, {
  caption: 'Important document'
});

// Send document from base64
await zap.sendDocument('22600000000', {
  content: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago...'
});
```

**Media Parameters:**
- `media` (object): Media content
  - `url` (string): URL to media file
  - `content` (string): Base64 encoded media data
- `options` (object, optional):
  - `caption` (string): Media caption
  - `viewOnce` (boolean): View once media
  - `quoted` (object): Message key to reply to
  - `gif` (boolean): Send video as GIF (video only)
  - `ptv` (boolean): Send as profile video (video only)

### Location Messages

#### `sendLocation(phone, lat, lng, options)`

Send a location.

```javascript
await zap.sendLocation('22600000000', 40.7128, -74.0060, {
  quoted: messageKey
});
```

**Parameters:**
- `phone` (string): Target phone number
- `lat` (number): Latitude
- `lng` (number): Longitude
- `options` (object, optional):
  - `quoted` (object): Message key to reply to

### Contact Messages

#### `sendContact(phone, contactData, options)`

Send a contact card.

```javascript
await zap.sendContact('22600000000', {
  name: 'John Doe',
  phone: '22611111111',
  org: 'Example Corp'
}, {
  quoted: messageKey
});
```

**Parameters:**
- `phone` (string): Target phone number
- `contactData` (object):
  - `name` (string, required): Contact name
  - `phone` (string, required): Contact phone number
  - `org` (string, optional): Organization name
- `options` (object, optional):
  - `quoted` (object): Message key to reply to

### Interactive Messages

#### `sendReaction(chatId, reaction, messageKey)`

Send a reaction to a message.

```javascript
await zap.sendReaction('22600000000', '👍', messageKey);

// Remove reaction
await zap.sendReaction('22600000000', '', messageKey);
```

**Parameters:**
- `chatId` (string): Chat identifier
- `reaction` (string): Emoji reaction (empty string to remove)
- `messageKey` (object, required): Key of message to react to

#### `sendPoll(phone, pollData, options)`

Send an interactive poll.

```javascript
await zap.sendPoll('22600000000', {
  name: 'What\'s your favorite color?',
  options: ['Red', 'Blue', 'Green', 'Yellow'],
  selectableCount: 1,
  toAnnouncementGroup: false
}, {
  quoted: messageKey
});
```

**Parameters:**
- `phone` (string): Target phone number
- `pollData` (object):
  - `name` (string, required): Poll question
  - `options` (array, required): Poll options (minimum 2)
  - `selectableCount` (number, optional): Max selectable options (default: 1)
  - `toAnnouncementGroup` (boolean, optional): For announcement groups
- `options` (object, optional):
  - `quoted` (object): Message key to reply to

### Message Management

#### `forwardMessage(phone, message, options)`

Forward a message to another chat.

```javascript
await zap.forwardMessage('22600000000', messageObject, {
  quoted: messageKey
});
```

**Parameters:**
- `phone` (string): Target phone number
- `message` (object, required): Message object to forward
- `options` (object, optional):
  - `quoted` (object): Message key to reply to

#### `pinMessage(chatId, messageKey, options)`

Pin or unpin a message in a chat.

```javascript
// Pin message for 24 hours
await zap.pinMessage('22600000000', messageKey, {
  duration: 86400
});

// Unpin message
await zap.pinMessage('22600000000', messageKey, {
  unpin: true
});
```

**Parameters:**
- `chatId` (string): Chat identifier
- `messageKey` (object, required): Key of message to pin
- `options` (object, optional):
  - `unpin` (boolean): Unpin the message
  - `duration` (number): Pin duration in seconds (default: 86400)

### Utility Methods

#### `isWhatsAppNumber(phone)`

Check if a phone number is registered on WhatsApp.

```javascript
const isRegistered = await zap.isWhatsAppNumber('22600000000');
console.log('Is WhatsApp number:', isRegistered);
```

**Parameters:**
- `phone` (string): Phone number to check

**Returns:**
- `boolean`: True if number is registered on WhatsApp

#### `isConnected()`

Check if the client is currently connected.

```javascript
const connected = zap.isConnected();
console.log('Connected:', connected);
```

**Returns:**
- `boolean`: True if connected to WebSocket

#### `getServerInfo()`

Get current server configuration.

```javascript
const serverInfo = zap.getServerInfo();
console.log('Server info:', serverInfo);
```

**Returns:**
- `object`: Server configuration details

#### `disconnect()`

Manually disconnect from the WebSocket.

```javascript
zap.disconnect();
```

## Events

The Zapwize client extends EventEmitter and emits the following events:

### `ready`
Emitted when the WebSocket connection is established and ready.

```javascript
zap.on('ready', (data) => {
  console.log('Connection ready:', data);
});
```

### `message`
Emitted when a new message is received.

```javascript
zap.on('message', (message) => {
  console.log('New message:', message);
});
```

### `connected`
Emitted when the WebSocket connection is established.

```javascript
zap.on('connected', () => {
  console.log('Connected to WebSocket');
});
```

### `disconnected`
Emitted when the WebSocket connection is lost.

```javascript
zap.on('disconnected', () => {
  console.log('Disconnected from WebSocket');
});
```

### `error`
Emitted when an error occurs.

```javascript
zap.on('error', (error) => {
  console.error('Error occurred:', error);
});
```

**Error Types:**
- `initialization`: Failed to initialize connection
- `websocket`: WebSocket connection errors
- `message_parsing`: Failed to parse incoming messages
- `reconnect`: Reconnection attempts failed

## Error Handling

The SDK includes comprehensive error handling:

```javascript
try {
  await zap.sendMessage('invalid_phone', 'Test message');
} catch (error) {
  console.error('Send failed:', error.message);
}

// Global error handling
zap.on('error', (error) => {
  switch (error.type) {
    case 'initialization':
      console.error('Failed to initialize:', error.error);
      break;
    case 'websocket':
      console.error('WebSocket error:', error.error);
      break;
    case 'message_parsing':
      console.error('Message parsing error:', error.error);
      break;
    case 'reconnect':
      console.error('Reconnection failed:', error.error);
      break;
  }
});
```

## Connection Management

The SDK automatically handles connection management:

- **Automatic reconnection** with exponential backoff
- **Maximum retry attempts** (default: 10)
- **Connection state tracking**
- **Graceful error recovery**

```javascript
// Monitor connection state
zap.on('connected', () => {
  console.log('✅ Connected');
});

zap.on('disconnected', () => {
  console.log('❌ Disconnected - attempting reconnection...');
});

zap.on('ready', () => {
  console.log('🚀 Ready to send messages');
});
```

## Best Practices

### 1. Always Handle Errors
```javascript
zap.on('error', (error) => {
  // Log errors for debugging
  console.error('Zapwize error:', error);
  
  // Implement retry logic if needed
  if (error.type === 'websocket') {
    // Connection will auto-retry
  }
});
```

### 2. Validate Phone Numbers
```javascript
async function sendSafeMessage(phone, message) {
  const isValid = await zap.isWhatsAppNumber(phone);
  if (!isValid) {
    throw new Error('Invalid WhatsApp number');
  }
  
  return await zap.sendMessage(phone, message);
}
```

### 3. Check Connection Status
```javascript
async function sendMessage(phone, message) {
  if (!zap.isConnected()) {
    throw new Error('Not connected to Zapwize');
  }
  
  return await zap.sendMessage(phone, message);
}
```

### 4. Handle Media Properly
```javascript
// Always specify media type explicitly
await zap.sendImage('22600000000', {
  url: 'https://example.com/image.jpg'
}, {
  caption: 'Image caption',
  viewOnce: false
});
```

### 5. Graceful Shutdown
```javascript
process.on('SIGINT', () => {
  console.log('Shutting down...');
  zap.disconnect();
  process.exit(0);
});
```

## CLI Usage

The CLI provides convenient commands for managing your Zapwize account:

```bash
# Global installation required
npm install -g zapwize

# Set your API key
zapwize config set-key YOUR_API_KEY

# Send a message
zapwize send 22600000000 "Hello from CLI!"

# Send an image
zapwize send-image 22600000000 https://example.com/image.jpg "Image caption"

# Check if number is on WhatsApp
zapwize check 22600000000

# Get account info
zapwize account
```

## Examples

### Chatbot Example
```javascript
const Zapwize = require('zapwize');

const bot = new Zapwize({ apiKey: 'your_api_key' });

bot.on('ready', () => {
  console.log('🤖 Bot is ready!');
});

bot.on('message', async (message) => {
  if (message.from && message.content) {
    const phone = message.from.number;
    const text = message.content.toLowerCase();
    
    if (text === 'hello') {
      await bot.sendMessage(phone, 'Hello! How can I help you?');
    } else if (text === 'help') {
      await bot.sendMessage(phone, 'Available commands:\n- hello\n- help\n- time');
    } else if (text === 'time') {
      await bot.sendMessage(phone, `Current time: ${new Date().toLocaleString()}`);
    } else {
      await bot.sendMessage(phone, 'Sorry, I didn\'t understand that. Type "help" for commands.');
    }
  }
});
```

### Media Sender Example
```javascript
const Zapwize = require('zapwize');

const zap = new Zapwize({ apiKey: 'your_api_key' });

async function sendDailyReport(phone) {
  try {
    // Send text message
    await zap.sendMessage(phone, '📊 Daily Report');
    
    // Send chart image
    await zap.sendImage(phone, {
      url: 'https://example.com/chart.png'
    }, {
      caption: 'Sales Chart'
    });
    
    // Send PDF document
    await zap.sendDocument(phone, {
      url: 'https://example.com/report.pdf'
    }, {
      caption: 'Detailed Report'
    });
    
    console.log('Daily report sent successfully!');
    
  } catch (error) {
    console.error('Failed to send daily report:', error.message);
  }
}

zap.on('ready', () => {
  sendDailyReport('22600000000');
});
```

## CLI Usage

Zapwize includes a command-line interface for managing your account and WhatsApp numbers.

### Utility Functions

```bash
# Check if a phone number is a valid WhatsApp number
zapwize check-number 22600000000
```


### Authentication

```bash
# Log in to your Zapwize account
zapwize login

# Log out
zapwize logout
```

### Managing WhatsApp Numbers

```bash
# List your WhatsApp numbers
zapwize numbers

# Link a new WhatsApp number by scanning QR code
zapwize link
```

### API Keys

```bash
# Create a new API key for a WhatsApp number
zapwize create-key 22600000000
```

### Subscription Plans

```bash
# List available subscription plans
zapwize plans

# Subscribe a WhatsApp number to a plan
zapwize subscribe 22600000000 plan_id
```

### Account Status

```bash
# Check your account status
zapwize status
```

## Getting Your API Key

To use the Zapwize SDK, you'll need to obtain an API key. Here are two ways to get one:

### Method 1: Using the Web Interface

1. **Create an Account**: Visit [https://app.zapwize.com/](https://app.zapwize.com/) and sign up for a new account.

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


## License

MIT © [Zapwize](https://zapwize.com)

## Support

- 📧 Email: support@zapwize.com
- 🌐 Website: https://zapwize.com
- 📚 Documentation: https://docs.zapwize.com

## Changelog

### v2.0.0
- ✨ Added separate methods for each media type
- ✨ Added poll, reaction, and pin message support
- ✨ Enhanced error handling and connection resilience
- ✨ Added automatic reconnection with exponential backoff
- ✨ Improved type validation and input sanitization
- 🔧 Breaking: Restructured media sending methods
- 🔧 Breaking: Updated event handling structure

