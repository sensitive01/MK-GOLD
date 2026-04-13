const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mk_gold_expenses',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp', 'heic'],
    upload_preset: 'goldbilling', // Ensure this exists in your Cloudinary console
  },
});

module.exports = { cloudinary, storage };
