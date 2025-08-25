const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class Zapwize extends EventEmitter {
  constructor(config) {
    super();
    
    if (!config?.apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.zapwize.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.client2 = null;
    this.socket = null;
    this.connected = false;
    this.serverInfo = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    
    this._initialize();
  }

  async _initialize() {
    try {
      const response = await this.client.get('/');
      
      if (!response?.data?.success) {
        this.emit('error', { type: 'initialization', error: 'Invalid API response' });
        return;
      }

      this.serverInfo = response.data.value;
      
      if (!this._validateServerInfo()) {
        this.emit('error', { type: 'initialization', error: 'Invalid server configuration' });
        return;
      }

      this._createSecondaryClient();
      this._connectWebSocket();
      
    } catch (error) {
      this.emit('error', { type: 'initialization', error: error.message || 'Initialization failed' });
    }
  }

  _validateServerInfo() {
    return this.serverInfo?.baseurl && this.serverInfo?.url && 
           this.serverInfo?.token && this.serverInfo?.msgapi && 
           this.serverInfo?.mediaapi;
  }

  _createSecondaryClient() {
    this.client2 = axios.create({
      baseURL: this.serverInfo.baseurl,
      timeout: 30000
    });
    
    this.msgUrl = `${this.serverInfo.baseurl}/${this.serverInfo.msgapi}?apikey=${this.apiKey}&token=${this.serverInfo.token}`;
    this.mediaUrl = `${this.serverInfo.baseurl}/${this.serverInfo.mediaapi}?apikey=${this.apiKey}&token=${this.serverInfo.token}`;
  }
  
  _connectWebSocket() {
    if (!this.serverInfo) return;
    
    const wsUrl = `${this.serverInfo.url}?apikey=${this.apiKey}&token=${this.serverInfo.token}`;
    this.socket = new WebSocket(wsUrl);
    
    this.socket.on('open', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });
    
    this.socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'ready') {
          this.emit('ready', message);
        } else {
          this.emit('message', message);
        }
      } catch (error) {
        this.emit('error', { type: 'message_parsing', error: error.message });
      }
    });
    
    this.socket.on('error', (error) => {
      this.emit('error', { type: 'websocket', error: error.message });
    });
    
    this.socket.on('close', () => {
      this.connected = false;
      this.emit('disconnected');
      this._handleReconnect();
    });
  }

  _handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', { type: 'reconnect', error: 'Max reconnect attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (!this.connected) {
        this._initialize();
      }
    }, Math.min(delay, 60000));
  }

  _ensureConnection() {
    if (!this.client2 || !this.connected) {
      throw new Error('Client not initialized or disconnected');
    }
  }

  _formatChatId(phone) {
    return String(phone).replace(/\D/g, '');
  }

  async sendMessage(phone, message, options = {}) {
    this._ensureConnection();
    
    const payload = {
      chatid: this._formatChatId(phone),
      content: String(message)
    };

    if (options.mentions) payload.mentions = options.mentions;
    if (options.quoted) payload.quoted = options.quoted;

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendImage(phone, media, options = {}) {
    return this._sendMediaContent(phone, media, 'image', options);
  }

  async sendVideo(phone, media, options = {}) {
    return this._sendMediaContent(phone, media, 'video', options);
  }

  async sendAudio(phone, media, options = {}) {
    return this._sendMediaContent(phone, media, 'audio', options);
  }

  async sendDocument(phone, media, options = {}) {
    return this._sendMediaContent(phone, media, 'document', options);
  }

  async _sendMediaContent(phone, media, mediaCategory, options = {}) {
    this._ensureConnection();

    if (!media || (typeof media !== 'object')) {
      throw new Error('Media object is required');
    }

    const payload = {
      chatid: this._formatChatId(phone),
      mediaCategory,
      type: media.url ? 'url' : 'base64',
      ...media
    };

    if (options.caption) payload.caption = options.caption;
    if (options.viewOnce) payload.viewOnce = true;
    if (options.gif && mediaCategory === 'video') payload.gif = true;
    if (options.ptv && mediaCategory === 'video') payload.ptv = true;
    if (options.quoted) payload.quoted = options.quoted;

    try {
      const response = await this.client2.post(this.mediaUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send ${mediaCategory}: ${error.message}`);
    }
  }

  async sendLocation(phone, lat, lng, options = {}) {
    this._ensureConnection();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }

    const payload = {
      chatid: this._formatChatId(phone),
      lat: Number(lat),
      lng: Number(lng)
    };

    if (options.quoted) payload.quoted = options.quoted;

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send location: ${error.message}`);
    }
  }

  async sendContact(phone, contactData, options = {}) {
    this._ensureConnection();

    if (!contactData?.name || !contactData?.phone) {
      throw new Error('Contact name and phone are required');
    }

    const payload = {
      chatid: this._formatChatId(phone),
      name: String(contactData.name),
      phone: String(contactData.phone),
      org: contactData.org || ''
    };

    if (options.quoted) payload.quoted = options.quoted;

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send contact: ${error.message}`);
    }
  }

  async sendReaction(chatId, reaction, messageKey) {
    this._ensureConnection();

    if (!messageKey) {
      throw new Error('Message key is required for reactions');
    }

    const payload = {
      chatid: this._formatChatId(chatId),
      reaction: String(reaction || ''),
      key: messageKey
    };

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send reaction: ${error.message}`);
    }
  }

  async sendPoll(phone, pollData, options = {}) {
    this._ensureConnection();

    if (!pollData?.name || !Array.isArray(pollData?.options) || pollData.options.length < 2) {
      throw new Error('Poll name and at least 2 options are required');
    }

    const payload = {
      chatid: this._formatChatId(phone),
      name: String(pollData.name),
      options: pollData.options.map(opt => String(opt)),
      selectableCount: Math.max(1, Math.min(pollData.selectableCount || 1, pollData.options.length)),
      toAnnouncementGroup: Boolean(pollData.toAnnouncementGroup)
    };

    if (options.quoted) payload.quoted = options.quoted;

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send poll: ${error.message}`);
    }
  }

  async forwardMessage(phone, message, options = {}) {
    this._ensureConnection();

    if (!message) {
      throw new Error('Message object is required for forwarding');
    }

    const payload = {
      chatid: this._formatChatId(phone),
      message
    };

    if (options.quoted) payload.quoted = options.quoted;

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to forward message: ${error.message}`);
    }
  }

  async pinMessage(chatId, messageKey, options = {}) {
    this._ensureConnection();

    if (!messageKey) {
      throw new Error('Message key is required for pinning');
    }

    const payload = {
      chatid: this._formatChatId(chatId),
      key: messageKey,
      unpin: Boolean(options.unpin),
      duration: Math.max(0, options.duration || 86400)
    };

    try {
      const response = await this.client2.post(this.msgUrl, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to pin message: ${error.message}`);
    }
  }

  async isWhatsAppNumber(phone) {
    try {
      const cleanPhone = this._formatChatId(phone);
      const response = await axios.get(`https://api.zapwize.com/v1/iswhatsapp?phone=${encodeURIComponent(cleanPhone)}`, {
        timeout: 10000
      });
      return Boolean(response?.data?.success && response?.data?.value);
    } catch (error) {
      return false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  isConnected() {
    return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  getServerInfo() {
    return this.serverInfo ? { ...this.serverInfo } : null;
  }
}

module.exports = Zapwize;