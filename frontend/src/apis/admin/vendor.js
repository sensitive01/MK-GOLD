import apiClient from '../http';

export const findVendor = async (data = {}) => {
  try {
    const response = await apiClient().post('/api/v1.0/admin/vendor/get', data);
    return response;
  } catch (err) {
    return { data: { status: false, message: err.message } };
  }
};

export const createVendor = async (data) => {
  try {
    const response = await apiClient().post('/api/v1.0/admin/vendor/create', data);
    return response;
  } catch (err) {
    return { data: { status: false, message: err.message } };
  }
};

export const updateVendor = async (id, data) => {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/vendor/update/${id}`, data);
    return response;
  } catch (err) {
    return { data: { status: false, message: err.message } };
  }
};

export const deleteVendor = async (id) => {
  try {
    const response = await apiClient().post(`/api/v1.0/admin/vendor/delete/${id}`);
    return response;
  } catch (err) {
    return { data: { status: false, message: err.message } };
  }
};
