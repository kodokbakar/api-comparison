import { useMemo, useState } from "react";

type JsonValue = unknown;

function App() {
  const apiBase = useMemo(() => {
    const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
    return envBase?.trim() ? envBase.trim() : "http://localhost:4000/api/v0";
  }, []);

  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [result, setResult] = useState<JsonValue>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function fetchJson(url: string) {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      const msg = typeof (data as any)?.message === "string" ? (data as any).message : "Request failed";
      throw new Error(msg);
    }
    return data;
  }

  async function loadSample() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await fetchJson(`${apiBase}/sample`);
      setProjectId(String((data as any).projectId || ""));
      setTaskId(String((data as any).taskId || ""));
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectDetail() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = projectId.trim();
      const [project, tasks] = await Promise.all([
        fetchJson(`${apiBase}/projects/${id}`),
        fetchJson(`${apiBase}/projects/${id}/tasks?take=50`)
      ]);
      setResult({ scenario: "project_detail_rest", project, tasks });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadTaskDetail() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = taskId.trim();
      const [task, project] = await Promise.all([
        fetchJson(`${apiBase}/tasks/${id}`),
        fetchJson(`${apiBase}/tasks/${id}/project`)
      ]);
      setResult({ scenario: "task_detail_rest", task, project });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">api-comparison</h1>
            <p className="text-sm text-slate-300 mt-1">Sprint 1: REST v0 + Prisma seed</p>
            <p className="text-xs text-slate-400 mt-2">API Base: {apiBase}</p>
          </div>
          <button
            onClick={loadSample}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-50"
          >
            Get sample IDs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-900/40 rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3">Project Detail (REST)</h2>
            <div className="flex gap-2">
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="projectId"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-sm border border-slate-700 focus:outline-none"
              />
              <button
                onClick={loadProjectDetail}
                disabled={loading || !projectId.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm disabled:opacity-50"
              >
                Fetch
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Calls: GET /projects/:id and GET /projects/:id/tasks
            </p>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3">Task Detail (REST)</h2>
            <div className="flex gap-2">
              <input
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="taskId"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-sm border border-slate-700 focus:outline-none"
              />
              <button
                onClick={loadTaskDetail}
                disabled={loading || !taskId.trim()}
                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-50"
              >
                Fetch
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Calls: GET /tasks/:id and GET /tasks/:id/project
            </p>
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-slate-300">Loading...</div>
        )}

        {error && (
          <div className="mt-6 text-sm text-rose-300">{error}</div>
        )}

        {result !== null && (
          <pre className="mt-6 text-xs bg-slate-950/60 border border-slate-800 rounded-2xl p-4 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;
