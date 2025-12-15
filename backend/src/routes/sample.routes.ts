import { Router } from "express";
import { getSamplesIds } from "../services/task.service";

export const sampleRouter = Router();

sampleRouter.get("/", async (req, res) => {
    try {
        const ids = await getSamplesIds();
        if (!ids) return res.status(404).json({ message: "seed data not found"});
        return res.json(ids);
    } catch {
        return res.status(500).json({ message: "internal server error"});
    }
})