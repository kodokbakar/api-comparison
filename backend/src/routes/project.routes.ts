import { Router } from "express";
import { prisma } from "../db";

export const projectsRouter = Router();

projectsRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const project = await prisma.project.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { tasks: true }}
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.json(project);
    } catch {
        return res.status(500).json({ message: "Internal server error"});
    }
});

projectsRouter.get("/:id/tasks", async (req, res) => {
    try {
        const id = req.params.id;

        const takeRaw = typeof req.query.take === "string" ? parseInt(req.query.take, 10) : 50;
        const skipRaw = typeof req.query.skip === "string" ? parseInt(req.query.skip, 10) : 0;

        const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 200) : 50;
        const skip = Number.isFinite(skipRaw) ? Math.max(skipRaw, 0) : 0;

        const exists = await prisma.project.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!exists) {
            return res.status(404).json({ message: "Project not found" });
        }

        const tasks = await prisma.task.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "asc" },
            skip,
            take
        })

        return res.json({ projectId: id, skip, take, items: tasks });
    } catch {
        return res.status(500).json({ message: "Internal server error"});
    }
})