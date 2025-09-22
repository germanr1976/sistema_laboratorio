import express from "express";
import cors from "cors";
import routes from "@/routes";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

export default app;
