# TASKS.md — Instrumentasi & Load Testing REST vs GraphQL

Stack: Express + TypeScript + PostgreSQL 16 + Node.js + k6 + GraphQL Yoga

Target: Rekayasa Ulang API Aplikasi Manajemen Proyek melalui Migrasi REST ke GraphQL
untuk Mitigasi Underfetching dan Overfetching (SINTA 1)

| Status dataset: ✅ 10.000 project & 50.000 task sudah ter-generate
| ID Pool status: ✅ Exported to k6/data/project_ids.json (10K) dan task_ids.json (50K)
| Script: scripts/export-ids.ts telah dibuat dan dijalankan

---

## Phase 1 — Pool ID untuk Random Access

- [x] Cek apakah `project.id` dan `task.id` di Postgres auto-increment berurutan atau UUID
  → **Result**: UUID (not sequential). IDs are generated with `@default(uuid())`.
  
- [x] Jika berurutan → cukup pakai range (`SELECT MIN(id), MAX(id) FROM projects`) langsung di k6
  → **N/A**: IDs are UUIDs, not sequential integers.
  
- [x] Jika UUID/tidak berurutan → buat `scripts/export-ids.ts` untuk query semua ID dan tulis ke `data/project_ids.json` dan `data/task_ids.json`
  → **Done**: Created and executed `scripts/export-ids.ts` successfully.
  
- [x] Validasi jumlah ID sesuai hasil generate (10.000 / 50.000)
  → **Verified**: project_ids.json = 10,000 entries ✅, task_ids.json = 50,000 entries ✅

---

## Phase 2 — Instrumentasi Timing di Backend

### 2.1 Utility Bersama
- [ ] Buat `src/utils/timer.ts` — pakai `process.hrtime.bigint()` (presisi nanodetik), bukan `Date.now()`
- [ ] Definisikan interface metrik seragam dipakai REST & GraphQL:
  ```ts
  interface RequestMetric {
    requestId: string;
    endpoint: string;
    method: 'REST' | 'GraphQL';
    timestamp: string;
    dbQueryCount: number;
    dbQueryTimeMs: number;
    serializationTimeMs: number;
    resolverTimingsMs?: Record<string, number>; // khusus GraphQL
    totalTimeMs: number;
  }
  ```
- [ ] Buat `src/utils/metricLogger.ts` — append tiap metrik ke file NDJSON (`logs/metrics-{scenario}-{timestamp}.ndjson`), jangan buffer semua run di memori

### 2.2 REST (Express)
- [ ] Buat middleware `requestTimingMiddleware` — catat `req.startTime` saat request masuk
- [ ] Di tiap route handler (project detail, task detail):
  - [ ] Bungkus query Prisma/`pg` dengan timer sebelum-sesudah → `dbQueryTimeMs`
  - [ ] Bungkus `res.json()` dengan timer sebelum-sesudah → `serializationTimeMs`
- [ ] Pakai `res.on('finish', ...)` untuk hitung `totalTimeMs` dan tulis metrik ke logger

### 2.3 GraphQL (Yoga)
- [ ] Aktifkan Prisma query logging (`log: ['query']`) untuk hitung `dbQueryCount` per request — dasar deteksi N+1
- [ ] Buat Yoga plugin custom (hook `onExecute`/`onResolverCalled`) untuk:
  - [ ] Timing per resolver → simpan ke `resolverTimingsMs`
  - [ ] Total waktu eksekusi query
- [ ] Bungkus proses serialisasi response Yoga dengan timer → `serializationTimeMs`
- [ ] Pastikan `dbQueryCount` diakumulasi per satu request GraphQL (bukan cuma per resolver)

### 2.4 Verifikasi Manual (WAJIB sebelum lanjut k6)
- [ ] Test 1 request manual REST via curl/Postman → cek log metrik lengkap dan masuk akal
- [ ] Test 1 request manual GraphQL via curl/Postman → cek `dbQueryCount` dan `resolverTimingsMs` benar
- [ ] Bandingkan manual: jumlah query REST (2 endpoint) vs GraphQL (1 query) sesuai ekspektasi

---

## Phase 3 — Skrip k6

### 3.1 Random ID Selection
- [ ] Buat `k6/utils/random-id.js` — load pool ID dari JSON (Phase 1) atau pakai `randomIntBetween(min, max)` kalau sequential
- [ ] Update `k6/rest-scenario.js` — ganti target ID statis dengan random dari pool
- [ ] Update `k6/graphql-scenario.js` — ganti target ID statis dengan random dari pool

### 3.2 Skenario Pembanding Caching (Opsional)
- [ ] Duplikasi jadi `k6/rest-scenario-fixed-id.js` dan `k6/graphql-scenario-fixed-id.js` — semua VU akses ID yang sama
- [ ] Beri tag/nama file jelas supaya hasil tidak tercampur dengan skenario random

### 3.3 Staged VU Levels
- [ ] Buat config `stages` k6 untuk VU: 20, 50, 100, 200, 500
- [ ] Samakan durasi tiap tahap (contoh: ramp-up 30s, steady 2m, ramp-down 30s) di semua level dan arsitektur
- [ ] Pisahkan tiap kombinasi VU sebagai file/env var (`K6_VUS=100 k6 run script.js`)

### 3.4 Dry-Run
- [ ] Jalankan VU 20 dulu untuk REST dan GraphQL
- [ ] Pastikan tidak ada error/crash di server maupun k6
- [ ] Cek random ID benar-benar bervariasi antar request
- [ ] Cek file metrik backend ter-generate dan sinkron dengan jumlah request k6

---

## Phase 4 — Network Simulation (Opsional, memperkuat validitas eksternal)

- [ ] Setup `toxiproxy` atau `tc` (Linux traffic control) untuk simulasi throttling
- [ ] Buat profil: LAN (10ms), WAN (50ms), 4G (200ms)
- [ ] Buat skrip wrapper untuk jalankan k6 dengan proxy aktif
- [ ] Dokumentasikan profil yang dipakai di tiap run, jangan campur tanpa label

---

## Phase 5 — Full Testing Execution

- [ ] Jalankan matriks lengkap: (REST vs GraphQL) × (5 level VU) × (target random vs fixed) × 5 run (untuk median)
- [ ] Simpan tiap run ke file terpisah dengan naming jelas: `{method}-{vu}vu-{targetType}-run{n}.ndjson`
- [ ] Simpan juga output `--summary-export` k6 untuk cross-check dengan log backend

---

## Phase 6 — Analisis Hasil

- [ ] Buat script analisis (`analysis/aggregate.ts` atau Python) untuk:
  - [ ] Gabungkan semua file log metrik per skenario
  - [ ] Hitung median/percentile (p50, p95, p99) per layer: db time, serialization time, total time
  - [ ] Bandingkan `dbQueryCount` REST vs GraphQL (cek indikasi N+1)
- [ ] Buat visualisasi breakdown waktu per layer, per level VU
- [ ] Highlight temuan yang tidak predictable (misal endpoint dengan GraphQL yang tidak lebih unggul)

---

## Catatan

- Prioritas terdekat: **Phase 1 dan Phase 2** — tanpa instrumentasi backend yang benar, hasil k6 tidak cukup dalam untuk analisis SINTA 1.
- Phase 4 opsional tapi menambah nilai untuk external validity — kerjakan kalau waktu memungkinkan.
- Jangan mulai Phase 5 sebelum dry-run Phase 3.4 benar-benar bersih dari error.
