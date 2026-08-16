// Auth primitives for Workers: JWT (jose), password hashing (PBKDF2 via WebCrypto)
// with bcrypt verification fallback for pre-existing users.

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const PBKDF2_ITERATIONS = 100000;

function secretKey(secret) {
  return new TextEncoder().encode(secret);
}

export async function generateTokenPair(id) {
  const secret = process?.env?.JWT_SECRET || globalThis.__ENV__?.JWT_SECRET || 'dev-secret';
  const token = await new SignJWT({ id, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secretKey(secret));
  const refreshToken = await new SignJWT({ id, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secretKey(secret + '_refresh'));
  return { token, refreshToken };
}

export async function verifyAccessToken(token) {
  const secret = process?.env?.JWT_SECRET || globalThis.__ENV__?.JWT_SECRET || 'dev-secret';
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token) {
  const secret = process?.env?.JWT_SECRET || globalThis.__ENV__?.JWT_SECRET || 'dev-secret';
  try {
    const { payload } = await jwtVerify(token, secretKey(secret + '_refresh'));
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes) {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

async function pbkdf2Hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(bits))}`;
}

async function pbkdf2Verify(password, iterations, saltB64, hashB64) {
  const salt = b64ToBytes(saltB64);
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: Number(iterations), hash: 'SHA-256' },
    keyMaterial,
    256
  ));
  const expected = b64ToBytes(hashB64);
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

export async function hashPassword(password) {
  return pbkdf2Hash(password);
}

export async function verifyPassword(password, hash) {
  if (!hash || !password) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
  if (hash.startsWith('pbkdf2$')) {
    const parts = hash.split('$');
    if (parts.length !== 4) return false;
    return pbkdf2Verify(password, parts[1], parts[2], parts[3]);
  }
  return false;
}

export async function recordLoginAttempt(user, success) {
  const now = new Date();
  const update = success
    ? { loginAttempts: 0, lockedUntil: null }
    : {
        $inc: { loginAttempts: 1 },
        ...(((user.loginAttempts || 0) + 1) >= MAX_LOGIN_ATTEMPTS
          ? { lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000) }
          : {}),
      };
  return update;
}

export function loginLocked(user) {
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000 / 60);
    return `Account locked. Try again in ${remaining} minutes`;
  }
  return null;
}

export function sha256Hex(input) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then((buf) => {
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  });
}

export async function hmacSha256Hex(secret, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  return ['super_admin', 'admin'].includes(user.role);
}

export function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: isAdmin(user),
    role: user.role || (isAdmin(user) ? 'admin' : 'customer'),
  };
}