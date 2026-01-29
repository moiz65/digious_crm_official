const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dmxf2mega',
  api_key: process.env.CLOUDINARY_API_KEY || '657384953237439',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'n12QQrH_pxd5ZZ4EV4hbqP5uFXg'
});

module.exports = cloudinary;