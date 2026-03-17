import axios from 'axios';
import global from '../utils/global';

export default function apiClient() {
  return axios.create({
    baseURL: global.baseURL,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
}
