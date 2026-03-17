const admin = require('firebase-admin');

// Service account will be provided in .env
// FIREBASE_CONFIG is a path to the JSON key or the JSON string itself
try {
  if (process.env.FIREBASE_CONFIG) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.warn("FIREBASE_CONFIG not found in .env. Firebase notifications are in stub mode.");
  }
} catch (error) {
  console.error("Firebase Admin initialization failed:", error.message);
}

const sendNotification = async (token, title, body, data = {}) => {
  if (!admin.apps.length) return { success: false, message: "Firebase not initialized" };
  
  const message = {
    notification: { title, body },
    token: token,
    data: data
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendNotification };
