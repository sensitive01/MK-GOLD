import apiClient from './http';

async function loginApi(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/auth/login', payload);
    return response.data;
  } catch (err) {
    return err.response.data ?? err;
  }
}

async function verifyLoginOtp(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/auth/login/verify-otp', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getUserTypeApi(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/auth/get-user-type', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

async function getBranchUserApi(payload) {
  try {
    const response = await apiClient().post('/api/v1.0/auth/get-branch-user', payload);
    return response.data;
  } catch (err) {
    return err;
  }
}

export { loginApi, getUserTypeApi, getBranchUserApi, verifyLoginOtp };
