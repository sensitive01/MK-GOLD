import apiClient from '../http';

async function getGoldRate(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/goldrate/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getGoldRateById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/goldrate/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createGoldRate(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/goldrate/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateGoldRate(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/goldrate/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteGoldRateById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/goldrate/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getGoldRate, getGoldRateById, createGoldRate, updateGoldRate, deleteGoldRateById };
