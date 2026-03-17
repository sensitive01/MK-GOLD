import apiClient from '../http';

async function getState(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/branch/state', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getBranch() {
  try {
    const response = await apiClient().get('/api/v1.0/branch/branch/get');
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getBranchById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/branch/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getBranchByBranchId(query) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/branch/find`, query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getBranch, getBranchById, getBranchByBranchId };
