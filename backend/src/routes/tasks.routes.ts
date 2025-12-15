import { Router } from "express";
import { getTask, getTaskDetail } from "../services/task.service";

export const tasksRouter = Router();

tasksRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const task = await getTask(id);

        if (!task) return res.status(404).json({ message: "Task not found"});
        return res.json(task);
    } catch {
        return res.status(500).json({ message: "internal server error"});
    }
});

tasksRouter.get("/:id/detail", async (req, res) => {
    try {
        const id = req.params.id;
        const project = await getTaskDetail(id);

        if (!project) return res.status(404).json({ message: "task or project not found"});
        return res.json(project);
    } catch {
        return res.status(500).json({ message: "internal server error"});
    }
})