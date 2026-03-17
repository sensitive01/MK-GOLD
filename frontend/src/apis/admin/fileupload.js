import apiClient from '../http';

async function getFile() {
  try {
    const response = await apiClient().get('/api/v1.0/admin/file-upload/get');
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getFileById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/file-upload/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findFile(query) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/file-upload/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createFile(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/file-upload/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteFileById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/file-upload/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { findFile, getFile, getFileById, createFile, deleteFileById };
