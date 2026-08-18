import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";
import path from "path";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🚀 Exporting ID pools from new_api_comparison database...\n");

    // Export Project IDs
    console.log("📦 Exporting Project IDs (10,000 projects)...");
    const projects = await prisma.project.findMany({
        select: { id: true },
        orderBy: { id: "asc" }
    });
    
    const projectIds = projects.map(p => p.id);
    console.log(`   ✅ Found ${projectIds.length} projects`);

    // Write to JSON file
    const dataDir = path.join(__dirname, "../../k6/data");
    const projectFile = path.join(dataDir, "project_ids.json");
    
    fs.writeFileSync(projectFile, JSON.stringify(projectIds, null, 2));
    console.log(`   ✅ Saved to: ${projectFile}`);

    // Export Task IDs
    console.log("\n📦 Exporting Task IDs (50,000 tasks)...");
    const tasks = await prisma.task.findMany({
        select: { id: true },
        orderBy: { id: "asc" }
    });
    
    const taskIds = tasks.map(t => t.id);
    console.log(`   ✅ Found ${taskIds.length} tasks`);

    // Write to JSON file
    const taskFile = path.join(dataDir, "task_ids.json");
    fs.writeFileSync(taskFile, JSON.stringify(taskIds, null, 2));
    console.log(`   ✅ Saved to: ${taskFile}`);

    // Validation
    console.log("\n🔍 Validation:");
    console.log(`   Projects count matches expected: ${projectIds.length === 10000 ? "✅" : "❌"}`);
    console.log(`   Tasks count matches expected: ${taskIds.length === 50000 ? "✅" : "❌"}`);

    console.log("\n✨ Export completed successfully!");
    console.log("\n📝 Usage in k6:");
    console.log("   import { projectIds, taskIds } from './data/project_ids.json';");
    console.log("   import { taskIds } from './data/task_ids.json';");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
