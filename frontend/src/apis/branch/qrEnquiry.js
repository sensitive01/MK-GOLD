import apiClient from '../http';

async function getQrEnquiries(query) {
  try {
    const response = await apiClient().post('/api/v1.0/branch/qr-enquiry/get', query);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getEnquiryByMkgId(mkgId) {
  try {
    const response = await apiClient().get(`/api/v1.0/branch/qr-enquiry/get-by-mkgid/${mkgId}`);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { getQrEnquiries, getEnquiryByMkgId };
