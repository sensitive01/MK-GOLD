import axios from 'axios';
import global from '../../utils/global';

export const getEnquiryByMkgId = async (mkgId) => {
  try {
    const res = await axios.get(`${global.baseURL}/api/v1.0/branch/qr-enquiry/get-by-mkgid/${mkgId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return res.data;
  } catch (err) {
    return { status: false, message: err.message };
  }
};
