import apiClient from '../http';

export async function getPayprocess(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/payprocess/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function createPayprocess(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/payprocess/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function updatePayprocess(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/payprocess/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function deletePayprocessById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/payprocess/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}
