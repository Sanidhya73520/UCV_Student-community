import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/connect.js';
import { startEmailWorker, stopEmailWorker } from './services/mailer.js';

async function start() {
  try {
    await connectDB();
    console.log(`Connected to MongoDB (${env.MONGODB_DB})`);

    // Start background email worker with concurrency control and crash recovery
    await startEmailWorker();

    const server = app.listen(env.PORT, () => {
      console.log(`UCV API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      await stopEmailWorker();
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
