import apiClient from '../http';

async function getOTP(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/otp/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getOTPById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/otp/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createOTP(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/otp/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateOTP(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/otp/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteOTPById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/otp/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getOTP, getOTPById, createOTP, updateOTP, deleteOTPById };
