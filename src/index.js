const axios = require('axios');
const FormData = require('form-data');

class Zapwize {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.zapwize.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  formatChatId(phone) {
    return `${phone}@c.us`;
  }

  async sendMessage(phone, message) {
    const chatId = this.formatChatId(phone);
    const response = await this.client.post('/message', {
      chatId,
      content: message
    });
    return response.data;
  }

  async sendMedia(phone, media) {
    const chatId = this.formatChatId(phone);
    const payload = {
      chatId,
      ...media
    };

    // If type is not specified, auto-detect based on presence of url or base64
    if (!media.type) {
      payload.type = media.url ? 'url' : 'base64';
    }

    const response = await this.client.post('/media', payload);
    return response.data;
  }

  async rpc(command) {
    const response = await this.client.post('/rpc', command);
    return response.data;
  }
}

module.exports = Zapwize;