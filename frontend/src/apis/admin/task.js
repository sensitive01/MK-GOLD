import apiClient from '../http';

export async function getTasks(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/task/get', query);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getMyTasks() {
  try {
    const response = await apiClient().get('/api/v1.0/task/my');
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getTaskById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/task/get/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: {} };
  }
}

export async function createTask(data) {
  try {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient().post('/api/v1.0/task/create', data, config);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function updateTask(id, data) {
  try {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient().post(`/api/v1.0/task/update/${id}`, data, config);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function updateTaskStatus(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/task/status/${id}`, payload);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function deleteTask(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/task/delete/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export default {
  getTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
