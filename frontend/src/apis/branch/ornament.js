import apiClient from '../http';

async function getOrnament(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/ornament/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getLatestPrint(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/ornament/get-latest-print', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateOrnament(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/ornament/update', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getOrnament, updateOrnament, getLatestPrint };
