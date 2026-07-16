import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('ll_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;
