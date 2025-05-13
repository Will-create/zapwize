const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class Zapwize extends EventEmitter {
  constructor(config) {
    super();
    
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.zapwize.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    
    
    this.socket = null;
    this.connected = false;
    this.serverInfo = null;
    
    // Initialize the connection
    this.initialize();
  }
  create_client(baseurl) {
    this.client2 = axios.create({
      baseURL: baseurl
    });
  }
  async initialize() {
    try {
      // Get server information and token
      const response = await this.client.get('/');
      if (!response.data.success) {
        this.emit('error', { type: 'initialization', error: 'Missing or invalid API key'});
        return;
      }

      console.log(response.data);
      this.serverInfo = response.data.value;
      this.create_client(this.serverInfo.baseurl);
      
      // Connect to WebSocket server
      this.connectWebSocket();
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
    }
  }
  
  connectWebSocket() {
    if (!this.serverInfo || !this.serverInfo.url || !this.serverInfo.token) {
      this.emit('error', { type: 'websocket', error: 'Missing server information' });
      return;
    }
    
    const wsUrl = `${this.serverInfo.url}?apikey=${this.apiKey}&token=${this.serverInfo.token}`;
    this.msgUrl = `${this.serverInfo.baseurl}/${this.serverInfo.msgapi}?apikey=${this.apiKey}&token=${this.serverInfo.token}`;
    this.mediaUrl = `${this.serverInfo.baseurl}/${this.serverInfo.mediaapi}?apikey=${this.apiKey}&token=${this.serverInfo.token}`;
    this.socket = new WebSocket(wsUrl);
    
    this.socket.on('open', () => {
      this.connected = true;
    });
    
    this.socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        // type = ready
        if (message.type === 'ready') {
          this.emit('ready', message);
          return;
        }

        this.emit('message', message);
      } catch (error) {
        this.emit('error', { type: 'message_parsing', error });
      }
    });
    
    this.socket.on('error', (error) => {
      this.emit('error', { type: 'websocket', error });
    });
    
    this.socket.on('close', () => {
      this.connected = false;
      this.emit('disconnected');
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!this.connected) {
          this.initialize();
        }
      }, 5000);
    });
  }

  formatChatId(phone) {
    return `${phone}`;
  }

  async sendMessage(phone, message) {
    if (!this.client2) {
      // not initialized
      this.emit('error', { type: 'websocket', error: 'Missing server information' });
      return;
    }
    const chatId = this.formatChatId(phone);
    const response = await this.client2.post(this.msgUrl, {
      chatid: chatId,
      content: message
    });
    return response.data;
  }
  async sendMedia(phone, media) {

    if (!this.client2) {
      // not initialized
      this.emit('error', { type: 'websocket', error: 'Missing server information' });
      return;
    }
    const chatId = this.formatChatId(phone);
    const payload = {
      chatid: chatId,
      ...media
    };

    // If type is not specified, auto-detect based on presence of url or base64
    if (!media.type) {
      payload.type = media.url ? 'url' : 'base64';
    }

    const response = await this.client2.post(this.mediaUrl, payload);
    return response.data;
  }
  
  // Close the WebSocket connection
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }
  async isWhatsAppNumber(phone) {
    try {
      // This endpoint doesn't require authentication
      const response = await axios.get(`https://api.zapwize.com/v1/iswhatsapp?phone=${encodeURIComponent(phone)}`);
      return response.data.success && response.data.value;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Zapwize;