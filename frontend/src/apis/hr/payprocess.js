import apiClient from '../http';

async function getPayprocess(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/hr/payprocess/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getPayprocessById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/hr/payprocess/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createPayprocess(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/hr/payprocess/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updatePayprocess(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/hr/payprocess/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deletePayprocessById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/hr/payprocess/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getPayprocess, getPayprocessById, createPayprocess, updatePayprocess, deletePayprocessById };
