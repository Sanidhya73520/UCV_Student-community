import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../config/env.js';
import { ensureInitialData } from './initialSeed.js';

// Ensure public DNS resolver is configured for SRV queries on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS config failure if restricted
}

mongoose.set('sanitizeFilter', false);
mongoose.set('strictQuery', true);

let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isDev = env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test';
    const opts = {
      maxPoolSize: 10,
      dbName: env.MONGODB_DB,
      autoIndex: env.NODE_ENV !== 'production'
    };

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then(async (m) => {
      console.log(`[DB] Connected to MongoDB Atlas (${env.MONGODB_DB})`);
      if (isDev) {
        await ensureInitialData();
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
