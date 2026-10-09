import apiClient from '../http';

export const findMelting = async (query = {}) => {
  try {
    const response = await apiClient().post('/api/v1.0/admin/melting/get', query);
    return response.data;
  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message,
      data: [],
    };
  }
};

export const createMelting = async (payload) => {
  try {
    const response = await apiClient().post('/api/v1.0/admin/melting/create', payload);
    return response.data;
  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message || 'Failed to create melting batch',
    };
  }
};

export const updateMelting = async (id, payload) => {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/melting/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message || 'Failed to update melting record',
    };
  }
};

export const deleteMelting = async (id) => {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/melting/delete/${id}`);
    return response.data;
  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message || 'Failed to delete melting record',
    };
  }
};

export const getNextBatchNumber = async () => {
  try {
    const response = await apiClient().get('/api/v1.0/admin/melting/next-batch-number');
    return response.data;
  } catch (err) {
    return {
      status: false,
      message: err?.response?.data?.message || err.message || 'Failed to generate batch number',
    };
  }
};

