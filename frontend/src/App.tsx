import { useMemo, useState } from "react";

type JsonValue = unknown;

function App() {
  const apiBase = useMemo(() => {
    const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
    return envBase?.trim() ? envBase.trim() : "http://localhost:4000/api/v0";
  }, []);

  const gqlEndpoint = useMemo(() => {
    const v = (import.meta as any).env?.VITE_GQL_ENDPOINT as string | undefined;
    return v?.trim() ? v.trim() : "http://localhost:4000/api/v1/graphql";
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

  async function gql<T>(query: string, variables?: Record<string, any>) {
    const res = await fetch(gqlEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json"},
      body: JSON.stringify({ query, variables})
    });
    const body = await res.json();
    if (!res.ok) throw new Error("GraphQL request failed");
    if (body?.errors?.length) throw new Error(body.errors[0]?.message || "GraphQL error");
    return body.data as T;
  }

  async function loadSampleRest() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await fetchJson(`${apiBase}/sample`);
      setProjectId(String((data as any).projectId || ""));
      setTaskId(String((data as any).tasId || ""));
      setResult({ api: "rest", data });
    } catch(e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSampleGraphql() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await gql<{ sample: { projectId: string; taskId: string }}>(
        "query { sample { projectId taskId } }"
      );
      setProjectId(data.sample.projectId);
      setTaskId(data.sample.taskId);
      setResult({ api: "graphql", data});
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectRest() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = projectId.trim();
      const [project, tasks] = await Promise.all([
        fetchJson(`${apiBase}/projects/${id}`),
        fetchJson(`${apiBase}/projects/${id}/tasks?take=50`)
      ]);
      setResult({ scenario: "project_detail", api: "rest", calls: 2, project, tasks});
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectGraphql() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = projectId.trim();
      const query = `
        query ProjectDetail($id: ID!, $skip: Int!, $take: Int!) {
          projectDetail(id: $id, skip: $skip, take: $take) {
            project { id name description createdAt updatedAt taskCount }
            tasks {
              projectId skip take
              items { id title status priority dueDate }
            }
          }
        }`;
        const data = await gql<{ projectDetail: any }>(query, { id, skip: 0, take: 50 });
        setResult({ scenario: "project_detail", api: "graphql", calls: 1, data: data.projectDetail });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadTaskRest() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = taskId.trim();
      const [task, project] = await Promise.all([
        fetchJson(`${apiBase}/tasks/${id}`),
        fetchJson(`${apiBase}/tasks/${id}/project`)
      ]);
      setResult({ scenario: "task_detail", api: "rest", calls: 2, task, project });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadTaskGraphql() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const id = taskId.trim();
      const query = `
        query TaskDetail($id: ID!) {
          taskDetail(id: $id) {
            task { id projectId title status priority dueDate }
            project { id name description createdAt updatedAt taskCount }
          }
        }`;
        const data = await gql<{ taskDetail: any }>(query, {id});
        setResult({ scenario: "task_detail", api: "graphql", calls: 1, data: data.taskDetail });
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10">
      <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">api-comparison</h1>
            <p className="text-sm text-slate-300 mt-1">Sprint 2: GraphQL v1 + shared service layer</p>
            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <div>REST Base: {apiBase}</div>
              <div>GraphQL Endpoint: {gqlEndpoint}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadSampleRest}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-50"
            >
              Get sample IDs (REST)
            </button>
            <button
              onClick={loadSampleGraphql}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-50"
            >
              Get sample IDs (GraphQL)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-900/40 rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3">Project Detail</h2>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="projectId"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-sm border border-slate-700 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={loadProjectRest}
                disabled={loading || !projectId.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm disabled:opacity-50"
              >
                Fetch REST (2 calls)
              </button>
              <button
                onClick={loadProjectGraphql}
                disabled={loading || !projectId.trim()}
                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-50"
              >
                Fetch GraphQL (1 call)
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3">Task Detail</h2>
            <input
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="taskId"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 text-slate-100 text-sm border border-slate-700 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={loadTaskRest}
                disabled={loading || !taskId.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm disabled:opacity-50"
              >
                Fetch REST (2 calls)
              </button>
              <button
                onClick={loadTaskGraphql}
                disabled={loading || !taskId.trim()}
                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-sm disabled:opacity-50"
              >
                Fetch GraphQL (1 call)
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="mt-6 text-sm text-slate-300">Loading...</div>}
        {error && <div className="mt-6 text-sm text-rose-300">{error}</div>}

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
