import apiClient from '../http';

export async function getNotifications(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/notification-management/get', query);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getNotificationById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/notification-management/get/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: {} };
  }
}

export async function createNotification(data) {
  try {
    const response = await apiClient().post('/api/v1.0/notification-management/create', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function updateNotification(id, data) {
  try {
    const response = await apiClient().post(`/api/v1.0/notification-management/update/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function deleteNotificationById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/notification-management/delete/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

