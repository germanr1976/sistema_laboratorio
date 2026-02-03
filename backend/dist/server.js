"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        await prisma.$connect();
        console.log("✅ Connected to database with Prisma");
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error("❌ Error connecting to the database:", err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map