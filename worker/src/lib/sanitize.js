// Minimal input sanitizers for Workers (replaces express-mongo-sanitize / xss / hpp).

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(id) {
  return typeof id === 'string' && OBJECT_ID_RE.test(id);
}

// Strip keys starting with $ and dots (Mongo operator injection protection).
function sanitizeMongoValue(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(sanitizeMongoValue);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = sanitizeMongoValue(v);
    }
    return out;
  }
  return value;
}

// Basic XSS string sanitization (script removal) while preserving safe HTML.
function sanitizeString(str) {
  return str
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["']?[^"'\s>]+/gi, '');
}

export function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body || {};
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith('$') || k.includes('.')) continue;
    if (typeof v === 'string') out[k] = sanitizeString(v);
    else if (Array.isArray(v)) out[k] = v.map((x) => typeof x === 'string' ? sanitizeString(x) : sanitizeMongoValue(x));
    else out[k] = sanitizeMongoValue(v);
  }
  return out;
}

export function sanitizeQuery(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (k.startsWith('$') || k.includes('.')) continue;
    out[k] = typeof v === 'string' ? sanitizeString(v) : v;
  }
  return out;
}

export function paginate(pageRaw, size = 12) {
  let page = parseInt(pageRaw, 10);
  if (isNaN(page) || page < 1) page = 1;
  return { page, limit: size, skip: (page - 1) * size };
}
