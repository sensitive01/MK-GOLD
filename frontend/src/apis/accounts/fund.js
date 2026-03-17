import apiClient from '../http';

async function getFund(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/fund/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getFundById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/accounts/fund/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createFund(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/fund/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateFund(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/fund/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteFundById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/fund/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getFund, getFundById, createFund, updateFund, deleteFundById };
