const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (buffer, mimetype, folder) => {
  return new Promise((resolve, reject) => {
    const b64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
    cloudinary.uploader.upload(
      b64,
      {
        folder: `lupe-luxe/${folder}`,
        resource_type: 'auto',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Silently fail if delete fails
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
