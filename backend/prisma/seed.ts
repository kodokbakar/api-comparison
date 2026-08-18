import "dotenv/config";
import { PrismaClient, TaskStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { exec } from "child_process";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter});

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickStatus(): TaskStatus {
    const values: TaskStatus[] = [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.DONE,
        TaskStatus.BLOCKED
    ];
    return values[randInt(0, values.length - 1)];
}

function maybeDueDate() {
    const hasDue = Math.random() < 0.7;
    if (!hasDue) return null;
    const daysAhead = randInt(1, 120);
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d;
}

function buildCounts(projectCount: number, totalTasks: number) {
    const minPerProject = 5;
    const counts = Array(projectCount).fill(minPerProject);
    let remaining = totalTasks - projectCount * minPerProject;

    while (remaining > 0) {
        const idx = randInt(0, projectCount - 1);
        const add = randInt(1, Math.min(remaining, 30));
        counts[idx] += add;
        remaining -= add;
    }

    return counts;
}

async function main() {
    // NEW: Larger dataset for SINTA 1 research
    const projectCount = 10000;
    const totalTasks = 50000;

    await prisma.task.deleteMany();
    await prisma.project.deleteMany();

    const projectIds: string[] = [];
    for (let i = 1; i <= projectCount; i++) {
        const project = await prisma.project.create({
            data: {
                name: `Project ${i}`,
                description: `Description for project ${i}`
            },
            select: { id: true }
        });
        projectIds.push(project.id);
    }

    const counts = buildCounts(projectCount, totalTasks);

    const tasksData: {
        projectId: string;
        title: string;
        description: string;
        status: TaskStatus;
        priority: number;
        dueDate: Date | null;
    }[] = [];

    let globalTaskNo = 1;

    for (let i = 0; i < projectIds.length; i++) {
        const pid = projectIds[i];
        const n = counts[i];

        for (let j = 1; j <= n; j++) {
            tasksData.push({
                projectId: pid,
                title: `Task ${globalTaskNo}`,
                description: `Detail for Task ${globalTaskNo}`,
                status: pickStatus(),
                priority: randInt(1, 5),
                dueDate: maybeDueDate()
            });
            globalTaskNo++;
        }
    }

    const chunkSize = 500;
    for (let i = 0; i < tasksData.length; i += chunkSize) {
        const chunk = tasksData.slice(i, i + chunkSize);
        await prisma.task.createMany({ data: chunk });
    }

    const projectTotal = await prisma.project.count();
    const taskTotal = await prisma.task.count();

    console.log(JSON.stringify({ projectTotal, taskTotal }, null, 2));

    // Send local notification using notify-send (Linux)
    exec(`notify-send "📊 Database Updated" "✅ Projects: ${projectTotal}\n✅ Tasks: ${taskTotal}\n\nReady for SINTA 1 research!"`, (err) => {
        if (err) {
            console.warn("⚠️ Could not send system notification:", err.message);
        } else {
            console.log("✅ System notification sent.");
        }
    });

    // WhatsApp notification (if WhatsApp CLI is available in future)
    // Uncomment below and replace with actual phone number when WhatsApp CLI is set up:
    /*
    const message = `📊 Database Updated Successfully!\n\n✅ Projects: ${projectTotal}\n✅ Tasks: ${taskTotal}\n\n🎯 Ready for SINTA 1 research load testing.`;
    
    exec(`whatsapp-cli send "+YOUR_PHONE_NUMBER" "${message.replace(/\n/g, "\\n")}"`, (err) => {
        if (err) {
            console.warn("⚠️ Could not send WhatsApp notification:", err.message);
        } else {
            console.log("✅ WhatsApp notification sent to home.");
        }
    });
    */
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })