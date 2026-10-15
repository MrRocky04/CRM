import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { provisionAdmin } from '../src/services/auth.service.js';
import prisma from '../src/db/prisma.js';

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@crm.local';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const name = process.argv[4] || process.env.ADMIN_NAME || 'CRM Administrator';

  console.log(`\n--- Provisioning Administrator Account ---`);
  console.log(`Target Email: ${email}`);
  console.log(`Display Name: ${name}`);

  try {
    const result = await provisionAdmin(email, password, name);
    if (result.created) {
      console.log(`✓ Admin user successfully CREATED with ID: ${result.user.id}`);
    } else {
      console.log(`✓ Existing user updated with ADMIN privileges. ID: ${result.user.id}`);
    }
    console.log(`✓ Ready for login at http://localhost:5173/login\n`);
  } catch (err) {
    console.error(`✗ Error provisioning admin:`, err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
