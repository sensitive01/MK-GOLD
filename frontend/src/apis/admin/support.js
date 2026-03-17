import apiClient from '../http';

async function getSupport(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/support/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findSupport(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/support/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getSupportById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/support/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createSupport(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/support/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateSupport(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/support/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteSupportById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/support/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getSupport, findSupport, getSupportById, createSupport, updateSupport, deleteSupportById };
