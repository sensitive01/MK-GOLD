import apiClient from '../http';

async function getLeads(query = {}) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/lead/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getLeadById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/lead/get/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createLead(data) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/lead/create', data);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function updateLead(id, data) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/lead/update/${id}`, data);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function deleteLeadById(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/lead/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function addDisposition(id, data) {
  try {
    const response = await apiClient().post(`/api/v1.0/branch/lead/disposition/${id}`, data);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getLeads, getLeadById, createLead, updateLead, deleteLeadById, addDisposition };
