import { prisma } from "../db";

export type ProjectSummary = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  taskCount: number;
};

export async function getProjectSummary(id: string): Promise<ProjectSummary | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { tasks: true } }
    }
  });

  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    taskCount: project._count.tasks
  };
}

export async function getProjectTasks(projectId: string, skip: number, take: number) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    skip,
    take
  });

  return tasks;
}

export async function getProjectDetail(projectId: string, skip: number, take: number) {
  const [project, tasks] = await Promise.all([
    getProjectSummary(projectId),
    getProjectTasks(projectId, skip, take)
  ]);

  if (!project) return null;

  return {
    project,
    tasks: {
      projectId,
      skip,
      take,
      items: tasks
    }
  };
}