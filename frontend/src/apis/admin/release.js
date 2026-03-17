import apiClient from '../http';

async function findRelease(query) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/release/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getRelease() {
  try {
    const response = await apiClient().get('/api/v1.0/admin/release/get');
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getReleaseById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/release/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getReleaseByCustomerId(id) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/release/get', {
      customer: id,
    });
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createRelease(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/release/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateRelease(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/release/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteReleaseById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/release/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export {
  findRelease,
  getRelease,
  getReleaseById,
  getReleaseByCustomerId,
  createRelease,
  updateRelease,
  deleteReleaseById,
};
