import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevDb() {
  console.log('Starting persistent MongoDB on port 27017 for local development...');
  try {
    const dbPath = path.resolve(__dirname, '../.mongo-data');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'ucv_dev',
        dbPath,
        storageEngine: 'wiredTiger',
        launchTimeout: 60000
      },
      binary: {
        version: '4.4.18'
      }
    });

    console.log('==================================================');
    console.log('IN-MEMORY MONGODB RUNNING:');
    console.log(`URI:     ${mongod.getUri()}`);
    console.log(`Port:    27017`);
    console.log(`Database: ucv_dev`);
    console.log('==================================================');

    process.on('SIGINT', async () => {
      console.log('Stopping in-memory MongoDB...');
      await mongod.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Stopping in-memory MongoDB...');
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err.message);
    process.exit(1);
  }
}

startDevDb();
