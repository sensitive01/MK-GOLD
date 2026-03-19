import apiClient from '../http';

async function getDesignation(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/designation/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getDesignationList(query = {}) {
  try {
    const response = await apiClient().get('/api/v1.0/admin/designation/get', { params: query });
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getDesignationById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/designation/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createDesignation(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/designation/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateDesignation(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/designation/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteDesignationById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/designation/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getDesignation, getDesignationList, getDesignationById, createDesignation, updateDesignation, deleteDesignationById };
