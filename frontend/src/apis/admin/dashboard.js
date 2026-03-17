import apiClient from '../http';

async function getCount() {
  try {
    const response = await apiClient().get('/api/v1.0/admin/dashboard/get');
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getCount };
