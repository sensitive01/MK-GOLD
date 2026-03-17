import apiClient from '../http';

async function getEmployee(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/employee/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getEmployee };
