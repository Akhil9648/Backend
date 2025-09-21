import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import { upload } from "./middlewares/multer.middleware.js"; // update with correct path

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cookieParser());

// Import user routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

app.get("/ping", (req, res) => {
  console.log("Ping received");
  res.send("pong");
});


// Global error handler - must be last middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export { app };
