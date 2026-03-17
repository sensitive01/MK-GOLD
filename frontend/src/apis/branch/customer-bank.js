import apiClient from '../http';

async function getBankById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/customer-bank/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createBank(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/customer-bank/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteBankById(customerId, id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/customer-bank/delete/${id}`, {
      customerId,
    });
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getBankById, createBank, deleteBankById };
