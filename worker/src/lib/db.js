// MongoDB Atlas Data API client for Cloudflare Workers.
// Requires env vars: ATLAS_DATA_API_URL, ATLAS_DATA_API_KEY, ATLAS_DATA_SOURCE, ATLAS_DATABASE

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Keys whose 24-hex string values should be treated as ObjectIds in filters/updates.
const OID_FIELDS = ['_id', 'user', 'product', 'uploadedBy', 'assignedTo', 'parent'];

export function isObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_RE.test(value);
}

// Convert filter/update structures: ObjectId keys get $oid wrapping, Dates get $date wrapping.
function convertValue(key, value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return { $date: value.toISOString() };
  if (typeof value === 'string') {
    if (OID_FIELDS.includes(key) && isObjectId(value)) return { $oid: value };
    return value;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.map((v) => convertValue(key, v));
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '$oid' && typeof v === 'string') out[k] = v;
      else if (k === '$date' && typeof v === 'string') out[k] = v;
      else out[k] = convertValue(k, v);
    }
    return out;
  }
  return value;
}

function convert(obj) {
  if (obj === null || obj === undefined) return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = convertValue(key, value);
  }
  return out;
}

// Convert extended EJSON in a returned document back to plain JS values.
export function fromDoc(doc) {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(fromDoc);
  if (typeof doc === 'object') {
    if (doc.$oid) return doc.$oid;
    if (doc.$date) return doc.$date;
    if (doc.$numberInt) return parseInt(doc.$numberInt, 10);
    if (doc.$numberLong) return parseInt(doc.$numberLong, 10);
    if (doc.$numberDouble) return parseFloat(doc.$numberDouble);
    if (doc.$numberDecimal) return parseFloat(doc.$numberDecimal);
    if (doc.$binary) return doc.$binary;
    const out = {};
    for (const [k, v] of Object.entries(doc)) out[k] = fromDoc(v);
    return out;
  }
  return doc;
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function newObjectId() {
  return randomHex(12);
}

async function callAction(action, payload) {
  const { ATLAS_DATA_API_URL, ATLAS_DATA_API_KEY, ATLAS_DATA_SOURCE, ATLAS_DATABASE } = getEnv();
  if (!ATLAS_DATA_API_URL || !ATLAS_DATA_API_KEY || !ATLAS_DATA_SOURCE || !ATLAS_DATABASE) {
    throw new Error('Atlas Data API not configured. Set ATLAS_DATA_API_URL, ATLAS_DATA_API_KEY, ATLAS_DATA_SOURCE, ATLAS_DATABASE.');
  }
  const res = await fetch(ATLAS_DATA_API_URL.replace(/\/$/, '') + '/action/' + action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': ATLAS_DATA_API_KEY,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ dataSource: ATLAS_DATA_SOURCE, database: ATLAS_DATABASE, ...payload }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!res.ok) {
    const msg = json?.error || json?.message || text || 'Data API error';
    throw new Error(msg);
  }
  return json;
}

// Env vars are injected by wrangler; in tests they come from process.env via the dev server.
function getEnv() {
  const e = globalThis.__ENV__ || {};
  return {
    ATLAS_DATA_API_URL: e.ATLAS_DATA_API_URL || process?.env?.ATLAS_DATA_API_URL || '',
    ATLAS_DATA_API_KEY: e.ATLAS_DATA_API_KEY || process?.env?.ATLAS_DATA_API_KEY || '',
    ATLAS_DATA_SOURCE: e.ATLAS_DATA_SOURCE || process?.env?.ATLAS_DATA_SOURCE || '',
    ATLAS_DATABASE: e.ATLAS_DATABASE || process?.env?.ATLAS_DATABASE || 'lupe-and-luxe',
  };
}

export function setEnv(env) {
  globalThis.__ENV__ = env;
}

export async function findOne(collection, filter, projection) {
  const payload = { collection, filter: convert(filter || {}) };
  if (projection) payload.projection = projection;
  const res = await callAction('findOne', payload);
  return res.document ? fromDoc(res.document) : null;
}

export async function find(collection, { filter, projection, sort, limit, skip } = {}) {
  const payload = { collection, filter: convert(filter || {}) };
  if (projection) payload.projection = projection;
  if (sort) payload.sort = convert(sort);
  if (limit) payload.limit = limit;
  if (skip) payload.skip = skip;
  const res = await callAction('find', payload);
  return (res.documents || []).map(fromDoc);
}

export async function insertOne(collection, doc) {
  const data = convert({ ...doc });
  if (!data._id) data._id = { $oid: newObjectId() };
  const res = await callAction('insertOne', { collection, document: data });
  return res.insertedId || data._id.$oid || data._id;
}

export async function insertMany(collection, docs) {
  const documents = docs.map((d) => {
    const data = convert({ ...d });
    if (!data._id) data._id = { $oid: newObjectId() };
    return data;
  });
  const res = await callAction('insertMany', { collection, documents });
  return res.insertedIds || [];
}

export async function updateOne(collection, filter, update, upsert = false) {
  const payload = { collection, filter: convert(filter || {}), update: convert(update), upsert };
  const res = await callAction('updateOne', payload);
  return { matchedCount: res.matchedCount || 0, modifiedCount: res.modifiedCount || 0, upsertedId: res.upsertedId };
}

export async function updateMany(collection, filter, update) {
  const payload = { collection, filter: convert(filter || {}), update: convert(update) };
  const res = await callAction('updateMany', payload);
  return { matchedCount: res.matchedCount || 0, modifiedCount: res.modifiedCount || 0 };
}

export async function deleteOne(collection, filter) {
  const res = await callAction('deleteOne', { collection, filter: convert(filter || {}) });
  return res.deletedCount || 0;
}

export async function deleteMany(collection, filter) {
  const res = await callAction('deleteMany', { collection, filter: convert(filter || {}) });
  return res.deletedCount || 0;
}

export async function count(collection, filter) {
  const res = await callAction('aggregate', {
    collection,
    pipeline: [{ $match: convert(filter || {}) }, { $count: 'n' }],
  });
  return res.documents?.[0]?.n || 0;
}

export async function aggregate(collection, pipeline) {
  const res = await callAction('aggregate', { collection, pipeline });
  return (res.documents || []).map(fromDoc);
}

export async function distinct(collection, field, filter) {
  const res = await callAction('aggregate', {
    collection,
    pipeline: [
      { $match: convert(filter || {}) },
      { $group: { _id: '$' + field } },
      { $sort: { _id: 1 } },
    ],
  });
  return (res.documents || []).map((d) => d._id).filter((v) => v !== null);
}
