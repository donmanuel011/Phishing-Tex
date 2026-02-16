import { useEffect, useState } from "react";
import "./App.css";

const API = process.env.REACT_APP_API_URL;


function StatCard({ title, value }) {
  return (
    <div className="card">
      <div className="muted">{title}</div>
      <div className="big">{value}</div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  async function fetchStats() {
    const res = await fetch(`${API_BASE}/api/admin/stats`);
    if (!res.ok) throw new Error("Failed to load stats");
    return res.json();
  }

  async function fetchRecent() {
    const res = await fetch(`${API_BASE}/api/admin/recent`);
    if (!res.ok) throw new Error("Failed to load recent scans");
    return res.json();
  }

  async function refreshPanels() {
    const [s, r] = await Promise.all([fetchStats(), fetchRecent()]);
    setStats(s);
    setRecent(r);
  }

  useEffect(() => {
    refreshPanels().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onScan(e) {
    e.preventDefault();
    setError("");
    setScanResult(null);

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Scan failed");

      setScanResult(data);
      await refreshPanels();
      setUrl("");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  const verdictClass =
    scanResult?.verdict === "phishing" ? "pill danger" : "pill safe";

  return (
    <div className="wrap">
      <header className="header">
        <h1>phising Tex</h1>
        <p className="muted">
          Intelligent URL security scanner using AI & cloud analytics to detect
          phishing threats instantly
        </p>
      </header>

      <form className="row" onSubmit={onScan}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL (e.g., http://free-gift.top/win)"
        />
        <button disabled={loading}>{loading ? "Scanning..." : "Scan"}</button>
      </form>

      {error ? <div className="alert">{error}</div> : null}

      {scanResult ? (
        <div className="card">
          <div className="rowBetween">
            <div>
              <div className="muted">Result</div>
              <div className="mono">{scanResult.url}</div>
            </div>
            <div className={verdictClass}>{scanResult.verdict}</div>
          </div>

          <div className="grid3">
            <StatCard
              title="ML Score"
              value={Number(scanResult.mlScore).toFixed(3)}
            />
            <StatCard
              title="Final Score"
              value={Number(scanResult.finalScore).toFixed(3)}
            />
            <StatCard
              title="Threat Intel"
              value={scanResult.provider || "none"}
            />
          </div>

          <div className="muted small">cached: {String(scanResult.cached)}</div>
        </div>
      ) : null}

      <div className="grid4">
        <StatCard title="Total Scans" value={stats?.total ?? "-"} />
        <StatCard title="Phishing" value={stats?.phishing ?? "-"} />
        <StatCard title="Legit" value={stats?.legit ?? "-"} />
        <StatCard
          title="Phishing Rate"
          value={
            stats?.phishingRate != null
              ? `${(stats.phishingRate * 100).toFixed(1)}%`
              : "-"
          }
        />
      </div>

      <div className="card">
        <div className="rowBetween">
          <h2 className="h2">Recent Scans</h2>
          <button
            className="ghost"
            type="button"
            onClick={() => refreshPanels().catch((e) => setError(e.message))}
          >
            Refresh
          </button>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>URL</th>
                <th>Verdict</th>
                <th>ML</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r._id}>
                  <td className="muted">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="mono">{r.url}</td>
                  <td>
                    <span
                      className={
                        r.verdict === "phishing" ? "pill danger" : "pill safe"
                      }
                    >
                      {r.verdict}
                    </span>
                  </td>
                  <td className="muted">{Number(r.mlScore).toFixed(3)}</td>
                  <td className="muted">{Number(r.finalScore).toFixed(3)}</td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No scans yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="muted small">
        Backend: {API_BASE} • ML: http://127.0.0.1:8000
      </footer>
    </div>
  );
}
