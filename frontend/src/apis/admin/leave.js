import apiClient from '../http';

async function getLeave(query) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/leave/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getLeaveById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/leave/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createLeave(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/leave/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateLeave(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/leave/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteLeaveById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/leave/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getLeave, getLeaveById, createLeave, updateLeave, deleteLeaveById };
