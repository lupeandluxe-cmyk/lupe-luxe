const cloudinary = require('../config/cloudinary');

function promiseWithTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      console.error(`[UPLOAD] ${label} timed out after ${ms}ms`);
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
    console.log(`[UPLOAD] ${label} — promise resolved or timed out`);
  });
}

const uploadToCloudinary = (buffer, mimetype, folder) => {
  console.log('[UPLOAD] uploadToCloudinary called', {
    mimetype,
    folder,
    bufferLength: buffer.length,
    maxSizeAllowed: 10 * 1024 * 1024,
    timeout: 30000,
  });

  if (!buffer || buffer.length === 0) {
    console.error('[UPLOAD] Empty buffer received');
    return Promise.reject(new Error('Empty file buffer'));
  }

  if (buffer.length > 10 * 1024 * 1024) {
    console.error('[UPLOAD] File exceeds 10MB limit — size:', buffer.length);
    return Promise.reject(new Error('File exceeds 10MB limit'));
  }

  return promiseWithTimeout(new Promise((resolve, reject) => {
    const b64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
    console.log('[UPLOAD] Base64 data URI length:', b64.length);
    console.log('[UPLOAD] Calling cloudinary.uploader.upload...');
    console.log('[UPLOAD] Cloudinary config:', {
      cloud_name: cloudinary.config().cloud_name ? 'SET' : 'MISSING',
      api_key: cloudinary.config().api_key ? 'SET' : 'MISSING',
      api_secret: cloudinary.config().api_secret ? 'SET' : 'MISSING',
    });

    cloudinary.uploader.upload(
      b64,
      {
        folder: `lupe-luxe/${folder}`,
        resource_type: 'auto',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          console.error('[UPLOAD] Cloudinary callback returned ERROR:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
            stack: error.stack?.substring(0, 200),
          });
          reject(error);
        } else {
          console.log('[UPLOAD] Cloudinary callback returned SUCCESS:', {
            public_id: result.public_id,
            secure_url: result.secure_url?.substring(0, 60),
            format: result.format,
            bytes: result.bytes,
          });
          resolve(result);
        }
      }
    );

    console.log('[UPLOAD] cloudinary.uploader.upload call completed (callback pending)');
  }), 30000, 'Cloudinary upload');
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    console.log('[UPLOAD] deleteFromCloudinary skipped — no publicId');
    return;
  }
  console.log('[UPLOAD] deleteFromCloudinary called for:', publicId);
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('[UPLOAD] Cloudinary delete result:', result);
  } catch (err) {
    console.error('[UPLOAD] Cloudinary delete error:', err.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };