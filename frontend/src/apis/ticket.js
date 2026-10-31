import apiClient from './http';

export async function getMyRaisedTickets(params = {}) {
  try {
    const response = await apiClient().get('/api/v1.0/ticket/my-raised', { params });
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getAssignedTickets(params = {}) {
  try {
    const response = await apiClient().get('/api/v1.0/ticket/assigned-to-me', { params });
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getAllTickets(params = {}) {
  try {
    const response = await apiClient().get('/api/v1.0/ticket/all', { params });
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getTicketById(id) {
  try {
    const response = await apiClient().get(`/api/v1.0/ticket/get/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: {} };
  }
}

export async function createTicket(data) {
  try {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient().post('/api/v1.0/ticket/create', data, config);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function updateTicketStatus(id, payload) {
  try {
    const response = await apiClient().post(`/api/v1.0/ticket/update-status/${id}`, payload);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function updateTicket(id, data) {
  try {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient().post(`/api/v1.0/ticket/update/${id}`, data, config);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function deleteTicket(id) {
  try {
    const response = await apiClient().post(`/api/v1.0/ticket/delete/${id}`);
    return response.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
}

export async function getTicketDesignations() {
  try {
    const response = await apiClient().get('/api/v1.0/ticket/meta/designations');
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

export async function getTicketEmployees(designation = '') {
  try {
    const params = designation ? { designation } : {};
    const response = await apiClient().get('/api/v1.0/ticket/meta/employees', { params });
    return response.data;
  } catch (err) {
    return { status: false, message: err.message, data: [] };
  }
}

