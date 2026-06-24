import apiClient from '../http';

export const findMelting = async (query = {}) => {
  try {
    const response = await apiClient().post('/api/v1.0/admin/melting/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
};

export const createMelting = async (payload) => {
  try {
    const response = await apiClient().post('/api/v1.0/admin/melting/create', payload);
    return response.data;
  } catch (err) {
    return err;
  }
};

export const updateMelting = async (id, payload) => {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/melting/update/${id}`, payload);
    return response.data;
  } catch (err) {
    return err;
  }
};

export const deleteMelting = async (id) => {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/melting/delete/${id}`);
    return response.data;
  } catch (err) {
    return err;
  }
};
