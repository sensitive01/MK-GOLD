const axios = require('axios');

const sendWhatsAppTemplate = async (to, templateName, components, languageCode = "en_US") => {
  // Using the provided Pinbot.ai URL
  const url = process.env.WHATSAPP_API_URL || 'https://partnersv1.pinbot.ai/v3/1288864100975414/messages';
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiKey) {
    console.error("WhatsApp API key is not configured.");
    return { success: false, error: "WhatsApp API key is not configured" };
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: components
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log("WhatsApp message sent to %s: %j", to, response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("WhatsApp sending failed:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

const sendWhatsAppOtp = async (phoneNumber, otp) => {
  // Constructing the components exactly as the client specified
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: otp.toString()
        }
      ]
    },
    {
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "payload",
          payload: otp.toString()
        }
      ]
    }
  ];

  return await sendWhatsAppTemplate(phoneNumber, "verification_otp", components, "en_US");
};

const sendValidationUpdate = async (phoneNumber, name, branchName, customerId, kycLink) => {
  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: name || "Customer"
        },
        {
          type: "text",
          text: branchName || "MK Gold"
        },
        {
          type: "text",
          text: customerId || ""
        },
        {
          type: "text",
          text: kycLink || "https://mkgold.tech/kyc"
        }
      ]
    }
  ];

  return await sendWhatsAppTemplate(phoneNumber, "validation_update_to_customer", components, "en");
};

module.exports = { sendWhatsAppTemplate, sendWhatsAppOtp, sendValidationUpdate };
