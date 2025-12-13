import { Router } from "express";
import { prisma } from "../db";

export const tasksRouter = Router();

tasksRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const task = await prisma.task.findUnique({
            where: { id }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found"});
        }

        return res.json(task);
    } catch {
        return res.status(500).json({ message: "Internal server error"});
    }
});

tasksRouter.get("/:id/project", async (req, res) => {
    try {
        const id = req.params.id;

        const task = await prisma.task.findUnique({
            where: { id },
            select: { projectId: true}
        });

        if (!task) {
            return res.status(404).json({ message: "task not found"});
        }

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { tasks: true}}
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found"});
        }

        return res.json(project);
    } catch {
        return res.status(500).json({ message: "internal server error"});
    }
})