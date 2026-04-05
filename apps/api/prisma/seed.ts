import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = process.env['SEED_ADMIN_PASSWORD'] ?? 'admin123';
  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gestao.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@gestao.local',
      password: hash,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user ready: ${admin.email}`);

  // Example categories
  const categoryNames = ['Bolos', 'Docinhos', 'Tortas', 'Salgados'];
  for (const name of categoryNames) {
    const existingCategory = await prisma.category.findFirst({
      where: { name },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: { name },
      });
    }
  }
  console.log('Categories seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
