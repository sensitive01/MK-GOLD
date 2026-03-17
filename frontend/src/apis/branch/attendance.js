import apiClient from '../http';

async function getAttendance(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/attendance/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getAttendanceById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/attendance/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createAttendance(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/attendance/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateAttendance(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/attendance/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteAttendanceById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/attendance/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getAttendance, getAttendanceById, createAttendance, updateAttendance, deleteAttendanceById };
