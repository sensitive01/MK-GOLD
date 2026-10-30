import apiClient from './http';

export async function getMyNotifications() {
  try {
    const response = await apiClient().get('/api/v1.0/notification-management/my');
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function markNotificationSeen(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/notification-management/seen/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

