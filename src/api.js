const axios = require('axios');
const Conf = require('conf').default;
const FormData = require('form-data');

const config = new Conf({
  projectName: 'zapwize-cli',
  encryptionKey: 'zapwize-secure-storage'
});

const BASE_URL = 'https://zapwize.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = config.get('session.token');
    if (token) {
      config.headers['x-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const makeApiRequest = async (schema, data) => {
  try {
    const payload = { schema };
    if (data) {
      payload.data = data;
    }
    const response = await api.post('/api/', payload);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(errorMessage);
  }
};

module.exports = { makeApiRequest };