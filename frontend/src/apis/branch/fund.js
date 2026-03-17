import apiClient from '../http';

async function getFund(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/fund/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findFund(query) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/fund/find', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getFundById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/fund/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createFund(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/fund/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateFund(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/fund/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteFundById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/fund/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getFund, findFund, getFundById, createFund, updateFund, deleteFundById };
