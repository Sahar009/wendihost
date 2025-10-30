const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2] || 'am.joshuajohnson@gmail.com';

  const totalUsers = await prisma.user.count();
  const user = await prisma.user.findUnique({ where: { email: targetEmail } });

  console.log(JSON.stringify({ totalUsers, targetEmail, exists: Boolean(user) }, null, 2));
}

main()
  .catch((err) => {
    console.error('Error running check:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



