// Cloudinary via REST API (fetch) — no SDK needed, works on Workers.

async function cloudinaryRequest(path, formData) {
  const cloud = envVar('CLOUDINARY_CLOUD_NAME');
  if (!cloud) throw new Error('Cloudinary not configured');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${path}`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error?.message || json.message || 'Cloudinary request failed');
  }
  return json;
}

function envVar(name) {
  return globalThis.__ENV__?.[name] || process?.env?.[name] || '';
}

async function sha1Hex(input) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadToCloudinary(arrayBuffer, mimetype, folder, originalName) {
  const cloud = envVar('CLOUDINARY_CLOUD_NAME');
  const apiKey = envVar('CLOUDINARY_API_KEY');
  const apiSecret = envVar('CLOUDINARY_API_SECRET');
  if (!cloud || !apiKey || !apiSecret) throw new Error('Cloudinary not configured');
  if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error('Empty file buffer');
  if (arrayBuffer.byteLength > 10 * 1024 * 1024) throw new Error('File exceeds 10MB limit');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folderPath = `lupe-luxe/${folder || 'general'}`;
  const signature = await sha1Hex(`folder=${folderPath}&timestamp=${timestamp}${apiSecret}`);

  const b64 = arrayBufferToBase64(arrayBuffer);
  const form = new FormData();
  form.append('file', `data:${mimetype || 'application/octet-stream'};base64,${b64}`);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', folderPath);
  form.append('signature', signature);

  const result = await cloudinaryRequest('image/upload', form);
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  const cloud = envVar('CLOUDINARY_CLOUD_NAME');
  const apiKey = envVar('CLOUDINARY_API_KEY');
  const apiSecret = envVar('CLOUDINARY_API_SECRET');
  if (!cloud || !apiKey || !apiSecret) return;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await sha1Hex(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  try {
    await cloudinaryRequest('image/destroy', form);
  } catch (err) {
    console.error('[CLOUDINARY] delete failed:', err.message);
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}