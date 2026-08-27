import "reflect-metadata";

import cors from "cors";
import express from "express";

import Environment from "./config/Environment";
import * as healthController from "./controllers/healthController";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler";
import authRouter from "./routes/authRoutes";
import profileRouter from "./routes/profileRoutes";
import todosRouter from "./routes/todoRoutes";
import usersRouter from "./routes/userRoutes";
import AsyncHandler from "./utils/AsyncHandler";

const app = express();

Environment.validate();
app.disable("x-powered-by");

app.use(
  cors({
    origin: Environment.clientOrigin,
  })
);
app.use(express.json({ limit: "20kb" }));

app.get("/", (_request, response) => {
  response.send("Staj App server is running!");
});
app.get("/api/health", AsyncHandler.wrap(healthController.getStatus));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/todos", todosRouter);
app.use("/api/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
