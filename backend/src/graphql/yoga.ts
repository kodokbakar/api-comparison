import { createSchema, createYoga } from "graphql-yoga";
import { getProjectDetail } from "../services/project.service";
import { getSamplesIds, getTaskDetail } from "../services/task.service";
import { create } from "node:domain";

function toIso(v: unknown) {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") return v;
    if (v instanceof Date) return v.toISOString();
    const d = new Date(v as any);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const typeDefs = /* GraphQL */ `
    enum TaskStatus {
        TODO
        IN_PROGRESS
        DONE
        BLOCKED
    }
    
    type SampleIds {
        projectId: String!
        taskId: String!
    }
    
    type Project {
        id: ID!
        name: String!
        description: String!
        createdAt: String!
        updatedAt: String!
        taskCount: Int!
    }
    
    type Task {
        id: ID!
        title: String!
        description: String!
        status: TaskStatus!
        priority: Int!
        dueDate: String
        createdAt: String!
        updatedAt: String!
    }
    
    type TaskPage {
        projectId: ID!
        skip: Int!
        take: Int!
        items: [Task!]!
    }
    
    type ProjectDetail {
        project: Project!
        tasks: TaskPage!
    }
    
    type Query {
        sample: SampleIds!
        projectDetail(id: ID!, skip: Int = 0, take: Int = 50): ProjectDetail!
        taskDetail(id: ID!): Task!
    }`;

const resolvers = {
    Query: {
        sample: async () => {
            const ids = await getSamplesIds();
            if (!ids) throw new Error("seed data not found");
            return ids;
        },
        projectDetail: async (_: unknown, args: {id: string; skip: number; take: number }) => {
            const take = Number.isFinite(args.take) ? Math.min(Math.max(args.take, 1), 200) : 50;
            const skip = Number.isFinite(args.skip) ? Math.max(args.skip, 0) : 0;

            const detail = await getProjectDetail(args.id, skip, take);
            if (!detail) throw new Error("project not found");
            return detail;
        },
        taskDetail: async (_: unknown, args: { id: string}) => {
            const detail = await getTaskDetail(args.id);
            if (!detail) throw new Error("task or project not found");
            return detail;
        }
    },
    Project: {
        createdAt: (p: any) => toIso(p.createdAt) ?? "",
        updatedAt: (p: any) => toIso(p.updatedAt) ?? ""
    },
    Task: {
        dueDate: (t: any) => toIso(t.dueDate),
        createdAt: (t: any) => toIso(t.createdAt) ?? "",
        updatedAt: (t: any) => toIso(t.updatedAt) ?? ""
    }
};

export const yoga = createYoga({
    schema: createSchema({ typeDefs, resolvers}),
    graphqlEndpoint: "/api/v1/graphql",
})