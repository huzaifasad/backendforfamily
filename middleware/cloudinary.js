const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: 'dgmboslsv',
  api_key: '185184138269322',
  api_secret: 'tG0JzLrz7qWG1--RtgddznmLtPU',
});

module.exports = cloudinary;
