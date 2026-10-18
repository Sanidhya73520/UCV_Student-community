
import app from '../src/app.js';
import { connectDB } from '../src/db/connect.js';

let dbPromise;

export default async function handler(req, res) {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().catch((error) => {
        dbPromise = null;
        throw error;
      });
    }

    await dbPromise;
    return app(req, res);
  } catch (error) {
    console.error('Backend initialization failed:', error);

    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
    });
  }
}
