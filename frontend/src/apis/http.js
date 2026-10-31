import axios from 'axios';
import global from '../utils/global';
import { isTokenExpired } from '../utils/token';

let isLoggingOut = false;

export function logoutUser() {
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

export default function apiClient() {
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    logoutUser();
  }

  const client = axios.create({
    baseURL: global.baseURL,
    headers: { Authorization: `Bearer ${token}` },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        logoutUser();
      }
      return Promise.reject(error);
    }
  );

  return client;
}
