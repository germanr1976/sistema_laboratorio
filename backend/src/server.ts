import app from "@/app";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import logger from "@/config/logger";

dotenv.config();

const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    logger.info("Connected to database with Prisma");

    app.listen(PORT, () => {
      logger.info({ port: PORT }, `Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, "Error connecting to the database");
    process.exit(1);
  }
}

main();
