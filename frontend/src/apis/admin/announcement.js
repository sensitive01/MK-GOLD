import apiClient from '../http';

async function getAnnouncements(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/announcement/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getAnnouncementById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/announcement/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createAnnouncement(data) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/announcement/create', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateAnnouncement(id, data) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/announcement/update/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteAnnouncementById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/announcement/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncementById };
