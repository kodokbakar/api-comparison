Judul eksperimen: Perbandingan REST v0 dan GraphQL v1 pada aplikasi manajemen proyek mahasiswa

Lingkup:
Sistem hanya mengimplementasikan endpoint bisnis untuk pengujian performa API. Autentikasi dan fitur UI penuh tidak dimasukkan dalam pengukuran.

Dataset:
40 project dan 2000 task, dibangkitkan melalui seed Prisma.

Versi sistem:
REST v0:
GET /api/v0/projects/:id
GET /api/v0/projects/:id/tasks?take=50&skip=0
GET /api/v0/tasks/:id
GET /api/v0/tasks/:id/project

GraphQL v1:
POST /api/v1/graphql
Query: projectDetail(id, take, skip)
Query: taskDetail(id)

Skenario uji:
S1 Project Detail:
REST: 2 request (project + tasks)
GraphQL: 1 request (projectDetail)

S2 Task Detail:
REST: 2 request (task + project)
GraphQL: 1 request (taskDetail)

Metrik:
Jumlah request (http_reqs)
p95 latensi (http_req_duration p95)
Error rate (http_req_failed)
Ukuran payload (payload_bytes_total)
p95 e2e (e2e_ms p95)

Prosedur:
Backend dijalankan pada mode build (node dist), database Postgres melalui docker.
Masing-masing skenario dijalankan 3 kali dan diringkas menggunakan median.
