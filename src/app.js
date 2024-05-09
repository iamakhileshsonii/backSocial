import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

// ROUTES IMPORT
import userRouter from "./routes/user.routes.js";

// ROUTES DECLERATION
app.use("/api/v1/user", userRouter);

// Register API: http://localhost:3456/api/v1/user/register

export { app };
