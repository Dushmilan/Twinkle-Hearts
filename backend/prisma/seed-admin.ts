import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Test@123', 10);

  // Upsert: create if not exists, update if exists
  const testUser = await prisma.user.upsert({
    where: { email: 'test@gmail.com' },
    create: {
      email: 'test@gmail.com',
      name: 'test',
      phone: '+94 12345678',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
    update: {
      name: 'test',
      phone: '+94 12345678',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user ready:');
  console.log('   Email:', testUser.email);
  console.log('   Name:', testUser.name);
  console.log('   Phone:', testUser.phone);
  console.log('   Role:', testUser.role);
  console.log('');
  console.log('   You can now login and access /admin');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
