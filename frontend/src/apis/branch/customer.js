import apiClient from '../http';

async function getCustomer(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findCustomer(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getCustomerById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/customer/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createCustomer(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateCustomer(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/customer/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteCustomerById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/customer/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function sendOtp(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer/send-otp', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function verifyOtp(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer/verify-otp', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export {
  getCustomer,
  findCustomer,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomerById,
  sendOtp,
  verifyOtp,
};
