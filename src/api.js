const axios = require('axios');
const Conf = require('conf').default;
const FormData = require('form-data');


const conf = new Conf({
  projectName: 'zapwize-cli',
  encryptionKey: 'zapwize-secure-storage'
});

const BASE_URL = 'https://zapwize.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (axiosConfig) => {
    const token = conf.get('session.token');
    if (token) {
      axiosConfig.headers['x-cli'] = token;
    }
    return axiosConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    // log response data for debugging
    let res = response.data;
    if (res && res.success == false && res.status == 401) {
      conf.delete('session');
      console.error('❌ Unauthorized. Please log in again using "zapwize login".');
      process.exit(1);
    }
    return response;
  },
  async (error) => {  
    if (error.response && error.response.status === 401) {
      conf.delete('session');
      console.error('❌ Unauthorized. Please log in again using "zapwize login".');
      process.exit(1);
    }
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