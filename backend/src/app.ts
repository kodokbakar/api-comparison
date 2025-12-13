import express, { Express, Request, Response } from "express";
import cors from "cors";
import { projectsRouter } from "./routes/project.routes";
import { tasksRouter } from "./routes/tasks.routes";
import { sampleRouter } from "./routes/sample.routes";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "OK" });
});

app.use("/api/v0/projects", projectsRouter);
app.use("/api/v0/tasks", tasksRouter);
app.use("/api/v0/sample", sampleRouter);

export { app };


