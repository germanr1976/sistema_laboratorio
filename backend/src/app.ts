import express from "express";
import cors from "cors";
import routes from "@/routes";

const app = express();

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", routes);

export default app;
