import apiClient from '../http';

async function getUser(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/user/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getUserById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/user/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createUser(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/user/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateUser(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/user/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteUserById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/user/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getUser, getUserById, createUser, updateUser, deleteUserById };
