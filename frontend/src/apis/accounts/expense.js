import apiClient from '../http';

async function getExpense(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/expense/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getExpenseById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/accounts/expense/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createExpense(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/expense/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateExpense(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/expense/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteExpenseById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/expense/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getExpense, getExpenseById, createExpense, updateExpense, deleteExpenseById };
