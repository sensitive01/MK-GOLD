import apiClient from './http';

async function getMyAnnouncements() {
  try {
    const response = await apiClient().get('/api/v1.0/announcement/my');
    return response.data;
  } catch (err) {
    return err;
  }
}

async function markAsSeen(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/announcement/seen/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getMyAnnouncements, markAsSeen };
