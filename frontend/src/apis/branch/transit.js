import apiClient from '../http';

async function findTransit(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/transit/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getTransitById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/transit/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createTransit(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/transit/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateTransit(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/transit/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteTransitById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/transit/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export {
  findTransit,
  getTransitById,
  createTransit,
  updateTransit,
  deleteTransitById,
};
