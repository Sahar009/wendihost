const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(JSON.stringify({ count: users.length, users }, null, 2));
}

main()
  .catch((err) => {
    console.error('Error listing users:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



