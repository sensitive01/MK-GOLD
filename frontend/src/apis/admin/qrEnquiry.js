import apiClient from '../http';

async function getQrEnquiries(query) {
  try {
    const response = await apiClient().post('/api/v1.0/admin/qr-enquiry/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getQrEnquiries };
