import apiClient from '../http';

async function findTransit(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/transit/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateTransitStatus(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/transit/update-status/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteTransitById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/transit/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export {
  findTransit,
  updateTransitStatus,
  deleteTransitById,
};
