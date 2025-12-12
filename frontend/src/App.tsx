function App() {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 bg-slate-800 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-semibold mb-2 text-emerald-400">
        api-comparison
      </h1>
      <p className="text-sm text-slate-300 mb-4">
        Sprint 0: baseline setup for REST and GraphQL performance comparison.
      </p>
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        <span>Backend health endpoint: http://localhost:4000/health</span>
      </div>
    </div>
  );
}

export default App;
