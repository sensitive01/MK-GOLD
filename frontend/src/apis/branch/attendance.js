import apiClient from '../http';

async function getAttendance(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/attendance/get', query);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

async function getAttendanceById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/attendance/get/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

async function createAttendance(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/attendance/create', payload);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

async function updateAttendance(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/attendance/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

async function deleteAttendanceById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/attendance/delete/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

async function getBranchAttendanceStats(employeeId = null) {
  try {
    const url = employeeId ? `/api/v1.0/branch/attendance/get-stats?employeeId=${employeeId}` : '/api/v1.0/branch/attendance/get-stats';
    const response = await apiClient().get(url);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

async function getConsolidatedAttendance(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/attendance/consolidated', query);
    return response.data;
  } catch (err) {
    return { status: false, message: err?.response?.data?.message || err.message };
  }
}

export {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendanceById,
  getBranchAttendanceStats,
  getConsolidatedAttendance,
};
