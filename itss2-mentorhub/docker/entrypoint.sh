#!/bin/sh
set -e

echo "-> Waiting for database..."
node -e "
const url = new URL(process.env.DATABASE_URL);
const net = require('net');
const port = parseInt(url.port || '5432', 10);
const host = url.hostname;
let tries = 0;
function ping() {
  const s = net.connect({ host, port }, () => { s.end(); process.exit(0); });
  s.on('error', () => {
    if (++tries > 60) { console.error('DB unreachable'); process.exit(1); }
    setTimeout(ping, 1000);
  });
}
ping();
"

echo "-> Applying Prisma schema (db push)..."
node ./node_modules/prisma/build/index.js db push --schema=./prisma/prisma/schema.prisma --accept-data-loss --skip-generate

if [ "$RUN_SEED" = "true" ]; then
  echo "-> Seeding database..."
  node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "Seed failed (continuing)"
fi

echo "-> Starting Next.js..."
exec "$@"
