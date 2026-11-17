import apiClient from '../http';

async function getAddressById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/customer-address/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createAddress(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer-address/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateAddress(id, payload) {
  try {
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const prefix = isAdmin ? '/api/v1.0/admin' : '/api/v1.0/branch';
    const response = await apiClient().post(`${prefix}/customer-address/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteAddressById(customerId, id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/customer-address/delete/${id}`, {
      customerId,
    });
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getAddressById, createAddress, updateAddress, deleteAddressById };
