import apiClient from '../http';

async function getLoginLogs(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/login-logs/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getLoginLogStats() {
  try {
    const response = await apiClient().get('/api/v1.0/admin/login-logs/stats');
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getLoginLogs, getLoginLogStats };

