import apiClient from '../http';

export async function getAttendance(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/attendance/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function getConsolidatedAttendance(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/attendance/consolidated', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function getAttendanceById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/accounts/attendance/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function createAttendance(body) {
  try {
    const response = await apiClient().post('/api/v1.0/accounts/attendance/create', body);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function updateAttendance(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/accounts/attendance/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export async function getBranchAttendanceStats(employeeId = null) {
  try {
    const url = employeeId ? `/api/v1.0/accounts/attendance/get-stats?employeeId=${employeeId}` : '/api/v1.0/accounts/attendance/get-stats';
    const response = await apiClient().get(url);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}
