import apiClient from '../http';

async function getBranch(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/hr/branch/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getBranchById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/hr/branch/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createBranch(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/hr/branch/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateBranch(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/hr/branch/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteBranchById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/hr/branch/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getNextBranchId() {
  try {
    const response = await apiClient().get('/api/v1.0/hr/branch/get-next-id');
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getBranch, getBranchById, createBranch, updateBranch, deleteBranchById, getNextBranchId };
