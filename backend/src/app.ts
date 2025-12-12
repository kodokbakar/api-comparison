import express, { Express, Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "OK" });
});

export { app };


