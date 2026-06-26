// CLI entrypoint for `npm run db:seed` / `npm run db:reset`.
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then((counts) => {
    console.log("Seed complete:", counts);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
