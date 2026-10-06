import apiClient from '../http';

async function getDesignation(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/hr/designation/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getDesignationList(query = {}) {
  try {
    const response = await apiClient().get('/api/v1.0/hr/designation/get', { params: query });
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getDesignation, getDesignationList };
