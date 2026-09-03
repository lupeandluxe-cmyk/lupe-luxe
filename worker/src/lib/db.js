// MongoDB Atlas access layer for Cloudflare Workers.
// Uses the official mongodb driver (>= 6.15 works on workerd via TCP sockets with nodejs_compat).
// Requires env secret: MONGODB_URI (standard Atlas connection string).
// Database is taken from env.ATLAS_DATABASE (fallback: name in the URI).

import { MongoClient, ObjectId } from 'mongodb';
import productsStatic from '../products-static.json';
import categoriesStatic from '../categories-static.json';
import homepageStatic from '../homepage-static.json';

const OID_FIELDS = ['_id', 'user', 'product', 'uploadedBy', 'assignedTo', 'parent'];

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_RE.test(value);
}

export function newObjectId() {
  return new ObjectId().toHexString();
}

let cachedClient = null;
let cachedUri = '';
let dbFailed = false;
let dbFailError = '';

const STATIC_DATA = {
  products: productsStatic,
  categories: categoriesStatic,
  homepagesections: homepageStatic,
};

function getUri() {
  const e = globalThis.__ENV__ || {};
  return e.MONGODB_URI || process?.env?.MONGODB_URI || '';
}

function getDbName() {
  const e = globalThis.__ENV__ || {};
  const override = e.ATLAS_DATABASE || process?.env?.ATLAS_DATABASE;
  if (override) return override;
  try {
    return new URL(getUri()).pathname.replace(/^\//, '') || 'lupe-and-luxe';
  } catch {
    return 'lupe-and-luxe';
  }
}

async function client() {
  const uri = getUri();
  if (!uri) throw new Error('MongoDB not configured. Set the MONGODB_URI secret (Atlas connection string).');
  if (cachedClient && cachedUri === uri && cachedClient.topology && !cachedClient.topology.isDestroyed() && !cachedClient.topology.isServerSelectionError()) {
    return cachedClient;
  }
  if (cachedClient) { try { await cachedClient.close(); } catch { /* ignore */ } }
  cachedUri = uri;
  cachedClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 30000,
      minPoolSize: 0,
      directConnection: true,
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    });
  return cachedClient;
}

export function setEnv(env) {
  globalThis.__ENV__ = env;
}

// Convert plain JS values (hex ids, EJSON wrappers, Dates) into BSON types.
function toBsonValue(key, value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date || value instanceof ObjectId) return value;
  if (typeof value === 'string') {
    if (key === '$oid') return new ObjectId(value);
    if (key === '$date') return new Date(value);
    if (key === '$numberInt' || key === '$numberLong') return parseInt(value, 10);
    if (key === '$numberDouble' || key === '$numberDecimal') return parseFloat(value);
    if (OID_FIELDS.includes(key) && isObjectId(value)) return new ObjectId(value);
    return value;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.map((v) => toBsonValue(key, v));
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toBsonValue(k, v);
    return out;
  }
  return value;
}

function toBson(obj) {
  if (obj === null || obj === undefined) return obj;
  return toBsonValue('', obj);
}

// Convert BSON types in returned documents back to plain JSON-safe values.
function fromDoc(doc) {
  if (doc === null || doc === undefined) return doc;
  if (doc instanceof ObjectId) return doc.toHexString();
  if (doc instanceof Date) return doc;
  if (Array.isArray(doc)) return doc.map(fromDoc);
  if (typeof doc === 'object') {
    if (typeof doc.toHexString === 'function' && typeof doc._bsontype === 'string' && doc._bsontype === 'ObjectId') {
      return doc.toHexString();
    }
    if (typeof doc._bsontype === 'string') {
      if (doc._bsontype === 'Long' || doc._bsontype === 'Int32') return Number(doc);
      if (doc._bsontype === 'Decimal128') return parseFloat(doc.toString());
      if (doc._bsontype === 'Binary') return doc.toBase64?.() ?? doc.toString();
      if (doc._bsontype === 'Timestamp') return doc.getHighBits ? Number(doc) : doc.toString();
      return doc.toString();
    }
    const out = {};
    for (const [k, v] of Object.entries(doc)) out[k] = fromDoc(v);
    return out;
  }
  return doc;
}

async function db() {
  if (dbFailed) throw new Error(dbFailError || 'Database unavailable');
  try {
    const c = await client();
    return c.db(getDbName());
  } catch (err) {
    dbFailed = true;
    dbFailError = err.message;
    console.error('[DB] Connection failed, using static data:', err.message);
    throw err;
  }
}

function getStatic(collection) {
  return STATIC_DATA[collection] || [];
}

function staticFind(collection, { filter, projection, sort, limit, skip } = {}) {
  let docs = [...getStatic(collection)];
  if (filter) {
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or') {
        docs = docs.filter(d => val.some(cond => matchStatic(d, cond)));
      } else {
        docs = docs.filter(d => matchStatic(d, { [key]: val }));
      }
    }
  }
  if (sort) {
    const entries = Object.entries(sort);
    docs.sort((a, b) => {
      for (const [k, dir] of entries) {
        const av = a[k], bv = b[k];
        if (av < bv) return dir === 1 ? -1 : 1;
        if (av > bv) return dir === 1 ? 1 : -1;
      }
      return 0;
    });
  }
  if (skip) docs = docs.slice(skip);
  if (limit) docs = docs.slice(0, limit);
  if (projection) {
    const include = Object.entries(projection).filter(([, v]) => v === 1).map(([k]) => k);
    if (include.length) docs = docs.map(d => Object.fromEntries(include.filter(k => k in d).map(k => [k, d[k]])));
  }
  return docs;
}

function matchStatic(doc, filter) {
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$ne') {
      for (const [k, v] of Object.entries(val)) {
        if (doc[k] === v) return false;
      }
      continue;
    }
    if (key === '$in') {
      for (const [k, arr] of Object.entries(val)) {
        if (!arr.includes(doc[k])) return false;
      }
      continue;
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (val.$regex) {
        const re = new RegExp(val.$regex, val.$options || '');
        if (!re.test(String(doc[key] || ''))) return false;
        continue;
      }
      if (val.$gte !== undefined && doc[key] < val.$gte) return false;
      if (val.$lte !== undefined && doc[key] > val.$lte) return false;
      if (val.$gt !== undefined && doc[key] <= val.$gt) return false;
      if (val.$lt !== undefined && doc[key] >= val.$lt) return false;
      continue;
    }
    if (doc[key] !== val) return false;
  }
  return true;
}

export async function findOne(collection, filter, projection) {
  const staticRows = getStatic(collection);
  if (staticRows.length > 0) {
    const match = staticRows.find(d => matchStatic(d, filter || {}));
    if (!match) return null;
    if (projection) {
      const include = Object.entries(projection).filter(([, v]) => v === 1).map(([k]) => k);
      if (include.length) return Object.fromEntries(include.filter(k => k in match).map(k => [k, match[k]]));
    }
    return match;
  }
  try {
    const cursor = await (await db()).collection(collection).findOne(toBson(filter || {}), projection ? { projection } : undefined);
    return cursor ? fromDoc(cursor) : null;
  } catch {
    return null;
  }
}

export async function find(collection, { filter, projection, sort, limit, skip } = {}) {
  const staticRows = getStatic(collection);
  if (staticRows.length > 0) return staticFind(collection, { filter, projection, sort, limit, skip });
  try {
    let cursor = (await db()).collection(collection).find(toBson(filter || {}), projection ? { projection } : undefined);
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    const docs = await cursor.toArray();
    return docs.map(fromDoc);
  } catch {
    return [];
  }
}

export async function insertOne(collection, doc) {
  const data = toBson(doc);
  if (!data._id) data._id = new ObjectId();
  const res = await (await db()).collection(collection).insertOne(data);
  return res.insertedId ? res.insertedId.toHexString() : '';
}

export async function insertMany(collection, docs) {
  const documents = docs.map((d) => {
    const data = toBson(d);
    if (!data._id) data._id = new ObjectId();
    return data;
  });
  const res = await (await db()).collection(collection).insertMany(documents);
  return Object.values(res.insertedIds).map((id) => id.toHexString());
}

export async function updateOne(collection, filter, update, upsert = false) {
  const res = await (await db()).collection(collection).updateOne(toBson(filter || {}), toBson(update), { upsert });
  return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount, upsertedId: res.upsertedId ? res.upsertedId.toHexString() : null };
}

export async function updateMany(collection, filter, update) {
  const res = await (await db()).collection(collection).updateMany(toBson(filter || {}), toBson(update));
  return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
}

export async function deleteOne(collection, filter) {
  const res = await (await db()).collection(collection).deleteOne(toBson(filter || {}));
  return res.deletedCount;
}

export async function deleteMany(collection, filter) {
  const res = await (await db()).collection(collection).deleteMany(toBson(filter || {}));
  return res.deletedCount;
}

export async function count(collection, filter) {
  const staticRows = getStatic(collection);
  if (staticRows.length > 0) return staticFind(collection, { filter }).length;
  return (await db()).collection(collection).countDocuments(toBson(filter || {}));
}

export async function aggregate(collection, pipeline) {
  const staticRows = getStatic(collection);
  if (staticRows.length > 0 && pipeline.length === 1 && pipeline[0].$match) {
    return staticFind(collection, { filter: pipeline[0].$match });
  }
  const docs = await (await db()).collection(collection).aggregate(toBson(pipeline)).toArray();
  return docs.map(fromDoc);
}

export async function distinct(collection, field, filter) {
  const staticRows = getStatic(collection);
  if (staticRows.length > 0) {
    const vals = new Set();
    for (const d of staticFind(collection, { filter })) {
      if (d[field] !== null && d[field] !== undefined) vals.add(d[field]);
    }
    return [...vals].sort();
  }
  return (await db()).collection(collection).distinct(field, toBson(filter || {}));
}