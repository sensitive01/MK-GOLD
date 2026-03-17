import apiClient from '../http';

async function getGoldRate(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/goldrate/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getGoldRateById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/goldrate/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getGoldRateByState(query) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/goldrate/find`, query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getGoldRate, getGoldRateById, getGoldRateByState };
