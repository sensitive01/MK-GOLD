import apiClient from '../http';

async function getSupportReply() {
  try {
    const response = await apiClient().get('/api/v1.0/admin/support-reply/get');
    return response.data;
  } catch (err) {
    return err;
  }
}

async function findSupportReply(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/support-reply/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getSupportReplyBySupportId(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/support-reply/get-by-support-id/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getSupportReplyById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/admin/support-reply/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createSupportReply(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/support-reply/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateSupportReply(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/support-reply/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteSupportById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/support-reply/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export {
  getSupportReply,
  findSupportReply,
  getSupportReplyById,
  getSupportReplyBySupportId,
  createSupportReply,
  updateSupportReply,
  deleteSupportById,
};
