import apiClient from '../http';

async function createCustomerKYC(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/public/kyc/customer', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createFileKYC(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/public/kyc/file-upload', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function createAddressKYC(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/public/kyc/address', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function sendOtpKYC(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/public/kyc/send-otp', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function verifyOtpKYC(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/public/kyc/verify-otp', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export {
  createCustomerKYC,
  createFileKYC,
  createAddressKYC,
  sendOtpKYC,
  verifyOtpKYC,
};
