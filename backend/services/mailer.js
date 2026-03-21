const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_PORT === '465', // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html, text = "") => {
  try {
    const info = await transporter.sendMail({
      from: `"MK Gold" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
