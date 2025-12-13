import { Router } from "express";
import { prisma } from "../db";

export const sampleRouter = Router();

sampleRouter.get("/", async (req, res) => {
    try {
        const project = await prisma.project.findFirst({ select: {id: true}});
        const task = await prisma.task.findFirst({ select: {id: true}});

        if (!project || !task) {
            return res.status(404).json({ message: "seed data not found"});
        }

        return res.json({ projectId: project.id, taskId: task.id });
    } catch {
        return res.status(500).json({ message: "internal server error"});
    }
})