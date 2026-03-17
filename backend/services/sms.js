const axios = require('axios');

const sendSms = async (phoneNumber, message, dltContentId) => {
  const username = process.env.SMS_USERNAME || 'mkgold.trans';
  const password = process.env.SMS_PASSWORD || 'hhwGK';
  const senderId = process.env.SMS_SENDER_ID || 'MKGOLD';
  
  const url = `https://pgapi.vispl.in/fe/api/v1/send`;
  
  try {
    const response = await axios.get(url, {
      params: {
        username,
        password,
        unicode: 'false',
        from: senderId,
        to: phoneNumber,
        text: message,
        dltContentId: dltContentId || process.env.SMS_DEFAULT_DLT_ID
      }
    });

    console.log("SMS sent to %s: %j", phoneNumber, response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("SMS sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

const sendOtpSms = async (phoneNumber, otp) => {
  const message = `Hi. Your One Time Password to login MK Gold World is ${otp}. This OTP is valid for 5 minutes only.`;
  const dltContentId = '1707168542360758659'; // Default OTP DLT ID
  return await sendSms(phoneNumber, message, dltContentId);
};

module.exports = { sendSms, sendOtpSms };
