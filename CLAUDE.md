# 📋 CLAUDE.md - Codebase Instructions & Context

## 🎯 Project Overview

**Project Name:** API Comparison v4 (REST vs GraphQL)  
**Research Goal:** Compare REST v0 vs GraphQL v1 performance for project management application  
**Target Publication:** SINTA 1 (Indonesian academic journal)  
**Current Status:** Dataset ready with 10K projects, 50K tasks  

---

## 🗄️ Database Configuration

### Current Setup
```bash
Database: new_api_comparison
Server: PostgreSQL 16 @ 172.26.0.2:5432
Container: api-comparison-db
```

### Environment Variable
```env
DATABASE_URL="postgresql://postgres:postgres@172.26.0.2:5432/new_api_comparison?schema=public"
```

### Quick Verification
```bash
cd backend
docker exec -i api-comparison-db psql -U postgres -d new_api_comparison -c \
  "SELECT 'Projects' as entity, COUNT(*) FROM \"Project\" UNION ALL SELECT 'Tasks', COUNT(*) FROM \"Task\";"
```

**Expected Output:** Projects: 10000, Tasks: 50000

---

## 🏗️ Architecture Structure

```
api-comparison-v4-sinta1/
├── backend/                  # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── app.ts           # Express app setup
│   │   ├── db.ts            # Prisma client
│   │   ├── graphql/yoga.ts  # GraphQL schema & resolvers
│   │   ├── routes/          # REST API endpoints (v0)
│   │   └── services/        # Business logic
│   ├── prisma/schema.prisma # Database schema
│   └── prisma/seed.ts       # Data generator (10K projects, 50K tasks)
│
├── frontend/                 # React + Vite (minimal UI)
├── k6/                       # Load testing scripts
│   ├── scenarios/
│   │   ├── project_detail_graphql.js
│   │   ├── task_detail_graphql.js
│   │   ├── project_detail_rest.js
│   │   └── task_detail_rest.js
│   └── lib/                  # Custom metrics & utilities
│
└── docs/                     # Research documentation
    ├── EXPERIMENT.md
    ├── QUERIES.md
    └── THREAT_TO_VALIDITY.md
```

---

## 🔑 Key API Endpoints

### REST v0 (Legacy - Uses Multiple Calls)
```
GET /api/v0/projects/:id              → Project details
GET /api/v0/projects/:id/tasks        → Task list (paginated)
GET /api/v0/tasks/:id                 → Task details
GET /api/v0/sample                    → Sample IDs for testing
```

### GraphQL v1 (New - Single Query)
```
POST /api/v1/graphql
```

**Example Queries:**
```graphql
query ProjectDetail($id: ID!, $skip: Int!, $take: Int!) {
  projectDetail(id: $id, skip: $skip, take: $take) {
    project { id name description taskCount }
    tasks { projectId skip take items { id title status priority } }
  }
}

query TaskDetail($id: ID!) {
  taskDetail(id: $id) {
    task { id title description status }
    project { id name }
  }
}
```

---

## 🧪 Testing Commands

### Start Services
```bash
docker-compose up -d
cd backend
npm run dev
```

### Run Load Tests
```bash
# Project Detail Scenario
k6 run k6/scenarios/project_detail_graphql.js
k6 run k6/scenarios/project_detail_rest.js

# Task Detail Scenario
k6 run k6/scenarios/task_detail_graphql.js
k6 run k6/scenarios/task_detail_rest.js
```

### Environment Variables for Tests
```bash
BASE_URL=http://localhost:4000
GQL_URL=http://localhost:4000/api/v1/graphql
PROJECT_ID=<get-from-sample-or-use-first-project-id>
TASK_ID=<get-from-sample-or-use-first-task-id>
TAKE=50
SKIP=0
VUS=20
DURATION=60s
SLEEP=1
RUNS=5
```

---

## 📊 Research Context & Gap Analysis

### Problem Statement
REST approach causes **underfetching** (multiple requests needed) and **overfetching** (receiving unused fields).

### Hypothesis
GraphQL reduces requests by ~50%, payload by 30-55%, and improves latency for composite data views.

### Current Gaps to Address (for SINTA 1):

1. ❌ **Limited Novelty** - Basic comparison is well-known
2. ✅ **Dataset Size** - NOW FIXED (10K projects instead of 40)
3. ⚠️ **Deep Metrics** - Need APM integration (New Relic, Prometheus)
4. ⚠️ **Business Impact** - Missing cost-benefit analysis
5. ⚠️ **Theoretical Framework** - Need decision model/formula

### Enhancement Priority
1. First: Add deeper monitoring metrics (APM tools)
2. Second: Expand test scenarios (network throttling, scalability)
3. Third: Create business impact calculator

---

## 💻 Development Commands Reference

### Database Operations
```bash
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Apply migrations
npm run db:seed           # Seed database (uses current .env)
npm run db:reset          # Reset entire database
npx prisma studio         # Open Prisma GUI
```

### Backend Dev
```bash
npm run dev               # Start in development mode
npm run build             # Build for production
npm start                 # Run production build
```

### Frontend Dev
```bash
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Build production bundle
npm run preview          # Preview production build
```

---

## 🐛 Common Troubleshooting

### Database Connection Issues
```bash
# Check if Docker containers are running
docker-compose ps

# If not running, restart them
docker-compose up -d

# Check container logs
docker-compose logs db
```

### "Table does not exist" Error
```bash
# This happens after fresh database creation
npx prisma migrate dev --name init
npm run db:seed
```

### Module Not Found
```bash
# In backend directory
npm install
npx prisma generate
```

### Port Already in Use
```bash
# Kill existing process on port 4000
lsof -ti:4000 | xargs kill -9
# Or use different port
PORT=4001 npm run dev
```

---

## 📈 Performance Baseline (Current Results)

### S1: Project Detail
- **Request Reduction:** 49.38% (REST → GraphQL)
- **Payload Reduction:** 54.85%
- **HTTP p95 Latency:** -27.95%
- **End-to-end p95:** -31.30%

### S2: Task Detail
- **Request Reduction:** 50.07%
- **Payload Reduction:** 29.74%
- **HTTP p95 Latency:** ~0% (negligible change)
- **End-to-end p95:** -3.22%

---

## 📝 Important Notes for AI Assistants

### When Given Tasks:

1. **Always verify database size first** - Should be 10K+ projects, 50K+ tasks
2. **Check .env configuration** - Must point to `new_api_comparison`
3. **Use absolute paths** - Workdir should be `/home/dokbakar/Projects/api-comparison-v4-sinta1/backend`
4. **Remember docker network** - DB is at 172.26.0.2:5432 inside container network

### For Enhancements:

1. **Respect research methodology** - Don't change experimental design without discussion
2. **Maintain backward compatibility** - Keep both REST and GraphQL endpoints
3. **Document all changes** - Update this file and relevant documentation
4. **Test thoroughly** - Ensure new features don't break existing benchmarks

### Safety Guidelines:

⚠️ **NEVER delete or reset the dataset without explicit confirmation**
⚠️ **ALWAYS backup before major schema changes**
⚠️ **TEST migrations on a copy first when possible**

---

## 📚 Documentation References

### Research Documents
- `v4_jurnal.md` - Full research paper in Indonesian
- `v4_sinta1_gap_analysis.md` - Gap analysis for SINTA 1 publication
- `docs/EXPERIMENT.md` - Experimental methodology
- `docs/QUERIES.md` - Test query specifications
- `docs/THREAT_TO_VALIDITY.md` - Threats to research validity

### Technical Docs
- `README.md` - Project overview
- `docker-compose.yml` - Container orchestration
- `backend/prisma/schema.prisma` - Data model
- `k6/` - Load testing configurations

---

## 🎓 Academic Context

### Institution
Universitas Muhammadiyah Malang, Informatics Study Program

### Research Type
Before-after experiment with equivalent features, dataset, and testing environment

### Key Contributors
- Primary Author: Yudhis Pratama
- Reviewers: Faculty peers, industry practitioners

### Target Journals
- SINTA 1 journals (e.g., JATIKOMIK, JITI, etc.)
- International conferences on software engineering

---

## 🔗 Useful External Resources

### Tools & Technologies
- **Load Testing:** https://k6.io/docs/
- **Prisma ORM:** https://www.prisma.io/docs
- **GraphQL Yoga:** https://the-guild.dev/graphql/yoga-server
- **Node.js Guide:** https://nodejs.org/docs/latest/api/

### Performance Testing Best Practices
- OWASP Load Testing Guide
- NIST Cloud Computing Performance Metrics
- ISO/IEC 25010 Software Quality Standards

---

## 📞 Contact & Support

For issues or questions about this codebase:
1. Check this CLAUDE.md file first
2. Review error messages and logs
3. Search session history for similar issues
4. Consult research team members

---

**Last Updated:** 2026-08-18  
**Version:** 1.0  
**Status:** Active Research Project ✅
