import { MongoBinary } from 'mongodb-memory-server-core';

async function main() {
  console.log('Ensuring MongoDB binary is downloaded for in-memory tests...');
  const binPath = await MongoBinary.getPath({});
  console.log('MongoDB binary ready at:', binPath);
}

main().catch((err) => {
  console.error('Download error:', err);
  process.exit(1);
});
