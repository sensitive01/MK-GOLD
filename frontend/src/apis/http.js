import axios from 'axios';
import global from '../utils/global';

let isLoggingOut = false;

export default function apiClient() {
  const client = axios.create({
    baseURL: global.baseURL,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        if (!isLoggingOut) {
          isLoggingOut = true;
          localStorage.removeItem('token');
          localStorage.removeItem('persist:root');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          setTimeout(() => {
            isLoggingOut = false;
          }, 3000);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
