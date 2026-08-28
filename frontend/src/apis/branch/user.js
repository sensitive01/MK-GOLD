import apiClient from '../http';

async function getUser(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/user/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getUser };
