const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const prisma = new PrismaClient();

const ADMIN_USER = {
  email: "kantabbrichard@gmail.com",
  password: "KBRich@2002",
  name: "Kantab Boruyal Richard",
};

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_USER.email },
    update: {
      name: ADMIN_USER.name,
      password: hashedPassword,
      isAdmin: true,
      isBlocked: false,
    },
    create: {
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      password: hashedPassword,
      isAdmin: true,
      isBlocked: false,
    },
  });

  const existingKey = await prisma.apiKey.findFirst({
    where: {
      userId: user.id,
      isBlocked: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const apiKey =
    existingKey ??
    (await prisma.apiKey.create({
      data: {
        userId: user.id,
        key: `dk_${crypto.randomBytes(32).toString("hex")}`,
        name: "Admin Seed Key",
      },
    }));

  console.log(
    JSON.stringify(
      {
        message: "Admin user seeded successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        apiKey: apiKey.key,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed admin user");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
