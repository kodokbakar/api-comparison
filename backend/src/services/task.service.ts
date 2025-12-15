import { prisma } from "../db";
import { getProjectSummary } from "./project.service";

export async function getTask(id: string) {
  return prisma.task.findUnique({ where: { id } });
}

export async function getTaskProject(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  });

  if (!task) return null;

  const project = await getProjectSummary(task.projectId);
  if (!project) return null;

  return project;
}

export async function getTaskDetail(taskId: string) {
  const [task, project] = await Promise.all([getTask(taskId), getTaskProject(taskId)]);
  if (!task || !project) return null;

  return { task, project };
}

export async function getSampleIds() {
  const [project, task] = await Promise.all([
    prisma.project.findFirst({ select: { id: true } }),
    prisma.task.findFirst({ select: { id: true } })
  ]);

  if (!project || !task) return null;

  return { projectId: project.id, taskId: task.id };
}