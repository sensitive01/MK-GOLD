import apiClient from '../http';

async function getBalancesheet(query) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/balancesheet/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getBalancesheet };
