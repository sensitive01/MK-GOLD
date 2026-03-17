import apiClient from '../http';

async function getOrnament(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/ornament/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function groupByBranchAndMovedAt(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/ornament/group-by', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateOrnament(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/ornament/update', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getOrnament, groupByBranchAndMovedAt, updateOrnament };
