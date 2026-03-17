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

export { getAddressById, createAddress, deleteAddressById };
