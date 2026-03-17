import apiClient from '../http';

async function getBalancesheet(query) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/balancesheet/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function calculateClosingBalance(query) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/balancesheet/calculate-closing-balance', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getBalancesheet, calculateClosingBalance };
