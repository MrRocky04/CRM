import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prismaDir = path.join(__dirname, '..', 'prisma');

const target = process.argv[2];

if (target === 'supabase') {
  fs.copyFileSync(path.join(prismaDir, 'schema.postgresql.prisma'), path.join(prismaDir, 'schema.prisma'));
  console.log('✓ Switched Prisma schema to Supabase PostgreSQL (schema.postgresql.prisma)');
  console.log('  Ensure DATABASE_URL and DIRECT_URL are set to your Supabase credentials in .env');
} else if (target === 'local') {
  // Read schema.postgresql.prisma and replace datasource with sqlite
  let content = fs.readFileSync(path.join(prismaDir, 'schema.postgresql.prisma'), 'utf8');
  content = content.replace(
    /datasource db {[\s\S]*?}/,
    `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
  );
  fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), content, 'utf8');
  console.log('✓ Switched Prisma schema to SQLite Local Mode');
} else {
  console.log('Usage: node scripts/switch-db.js [supabase|local]');
}
