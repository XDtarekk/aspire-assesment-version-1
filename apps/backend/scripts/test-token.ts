/**
 * Prints a JWT for API testing. Uses ADMIN_EMAIL from .env (default admin@example.com)
 * to look up the user and sign a token with sub + role.
 * Usage: npm run test:token   (from apps/backend, with .env loaded)
 */
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { prisma } from '@aspire/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const email = process.env.ADMIN_EMAIL || 'admin@example.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('No user found for', email, '- run npm run db:seed first');
    process.exit(1);
  }
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  console.log('Use this header for authenticated requests:\n');
  console.log('Authorization: Bearer', token);
  console.log('\nUser:', user.id, user.email, user.role);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
