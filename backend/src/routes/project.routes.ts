import { Router } from "express";
import { getProjectSummary, getProjectTasks } from "../services/project.service";

export const projectsRouter = Router();

projectsRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const project = await getProjectSummary(id);

        if (!project) return res.status(404).json({ message: "Project not found"});
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

        const exist = await getProjectSummary(id);
        if (!exist) return res.status(404).json({ message: "Project not found"});

        const tasks = await getProjectTasks(id, skip, take);
        return res.json({projectId: id, skip, take, items: tasks});
    } catch {
        return res.status(500).json({ message: "Internal server error"});
    }
});