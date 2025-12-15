import { Router } from "express";
import { getSampleIds } from "../services/task.service";

export const sampleRouter = Router();

sampleRouter.get("/", async (req, res) => {
  try {
    const ids = await getSampleIds();
    if (!ids) return res.status(404).json({ message: "Seed data not found" });
    return res.json(ids);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});
