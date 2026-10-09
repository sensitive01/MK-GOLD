import apiClient from '../http';

async function getUser(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/user/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateUser(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/user/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getUser, updateUser };
