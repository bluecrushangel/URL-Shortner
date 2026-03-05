import { useState } from "react";

const API_URL = "http://localhost:3000";
const ANALYTICS_URL = "http://localhost:3001";

function BarChart({ data, label }) {
  if (!data || data.length === 0) return <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No data yet</p>;
  const max = Math.max(...data.map(d => Number(d.count)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "90px", fontSize: "0.72rem", color: "var(--muted)", textAlign: "right", flexShrink: 0, letterSpacing: "0.03em" }}>
            {d[label] || "Unknown"}
          </span>
          <div style={{ flex: 1, background: "var(--surface2)", borderRadius: "2px", height: "18px", overflow: "hidden" }}>
            <div style={{
              width: `${(Number(d.count) / max) * 100}%`,
              height: "100%",
              background: "var(--accent)",
              borderRadius: "2px",
              transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 0 10px var(--accent-glow)"
            }} />
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--fg)", width: "24px", flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineChart({ data }) {
  if (!data || data.length === 0) return <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>No timeline data yet</p>;
  const max = Math.max(...data.map(d => Number(d.count)));
  const h = 80;
  const w = 300;
  const pts = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - (Number(d.count) / max) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${h} ${polyline} ${w},${h}`;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "80px" }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#grad)" />
        <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
          const y = h - (Number(d.count) / max) * h;
          return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
            {String(d.day).slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [statsCode, setStatsCode] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const shorten = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed to shorten URL");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchStats = async () => {
    if (!statsCode.trim()) return;
    setStatsLoading(true);
    setStatsError(null);
    setStats(null);
    try {
      const res = await fetch(`${ANALYTICS_URL}/stats/${statsCode.trim()}`);
      if (!res.ok) throw new Error("Code not found");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setStatsError(e.message);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080b0f;
          --surface: #0e1318;
          --surface2: #151c24;
          --border: #1e2a35;
          --accent: #00e5ff;
          --accent-glow: rgba(0,229,255,0.25);
          --accent2: #ff3d6e;
          --fg: #e8edf2;
          --muted: #4a6070;
          --success: #00e676;
        }

        body {
          background: var(--bg);
          color: var(--fg);
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* grid background */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .header {
          margin-bottom: 56px;
        }

        .eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .eyebrow::before {
          content: '';
          display: inline-block;
          width: 20px;
          height: 1px;
          background: var(--accent);
        }

        h1 {
          font-size: clamp(2.2rem, 6vw, 3.4rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--fg);
        }

        h1 span {
          color: var(--accent);
        }

        .subtitle {
          margin-top: 12px;
          font-size: 0.9rem;
          color: var(--muted);
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.02em;
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 28px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.5;
        }

        .card-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 16px;
        }

        .input-row {
          display: flex;
          gap: 10px;
        }

        input {
          flex: 1;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 11px 14px;
          color: var(--fg);
          font-family: 'Space Mono', monospace;
          font-size: 0.82rem;
          outline: none;
          transition: border-color 0.2s;
        }

        input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        input::placeholder { color: var(--muted); }

        button {
          background: var(--accent);
          color: #000;
          border: none;
          border-radius: 4px;
          padding: 11px 20px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: opacity 0.15s, transform 0.1s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        button:hover { opacity: 0.85; }
        button:active { transform: scale(0.97); }
        button:disabled { opacity: 0.4; cursor: not-allowed; }

        button.secondary {
          background: var(--surface2);
          color: var(--fg);
          border: 1px solid var(--border);
        }

        .result-box {
          margin-top: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          animation: slideIn 0.3s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .result-url {
          font-family: 'Space Mono', monospace;
          font-size: 0.82rem;
          color: var(--accent);
          word-break: break-all;
        }

        .code-badge {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          background: rgba(0,229,255,0.08);
          border: 1px solid rgba(0,229,255,0.2);
          color: var(--accent);
          padding: 2px 8px;
          border-radius: 3px;
          margin-left: 8px;
        }

        .error {
          margin-top: 12px;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: var(--accent2);
          padding: 10px 14px;
          background: rgba(255,61,110,0.07);
          border: 1px solid rgba(255,61,110,0.2);
          border-radius: 4px;
        }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 28px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-tile {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 16px;
        }

        .stat-num {
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .stat-desc {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 4px;
        }

        .section-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 12px;
          margin-top: 20px;
        }

        .loading-dots::after {
          content: '...';
          animation: dots 1s steps(3, end) infinite;
        }

        @keyframes dots {
          0%, 33% { content: '.'; }
          66% { content: '..'; }
          100% { content: '...'; }
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 3px 8px;
          margin-bottom: 20px;
        }

        .dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 6px var(--success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .input-row { flex-direction: column; }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <div className="eyebrow">distributed system</div>
          <h1>URL<br /><span>Shortener</span></h1>
          <p className="subtitle">// redis cache · pub/sub analytics · postgresql</p>
        </div>

        {/* Shorten Card */}
        <div className="card">
          <div className="tag"><span className="dot" />services online</div>
          <div className="card-label">01 — shorten a url</div>
          <div className="input-row">
            <input
              type="text"
              placeholder="https://your-long-url.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && shorten()}
            />
            <button onClick={shorten} disabled={loading || !url.trim()}>
              {loading ? <span className="loading-dots">shortening</span> : "Shorten →"}
            </button>
          </div>

          {error && <div className="error">⚠ {error}</div>}

          {result && (
            <div className="result-box">
              <div>
                <span className="result-url">{result.short_url}</span>
                <span className="code-badge">{result.code}</span>
              </div>
              <button className="secondary" onClick={copy} style={{ padding: "7px 14px", fontSize: "0.75rem" }}>
                {copied ? "✓ copied" : "copy"}
              </button>
            </div>
          )}
        </div>

        {/* Analytics Card */}
        <div className="card">
          <div className="card-label">02 — analytics</div>
          <div className="input-row">
            <input
              type="text"
              placeholder="enter short code e.g. xqjM_9X"
              value={statsCode}
              onChange={e => setStatsCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchStats()}
            />
            <button onClick={fetchStats} disabled={statsLoading || !statsCode.trim()}>
              {statsLoading ? <span className="loading-dots">loading</span> : "Analyze →"}
            </button>
          </div>

          {result && (
            <div style={{ marginTop: "10px" }}>
              <button
                className="secondary"
                style={{ fontSize: "0.72rem", padding: "6px 12px" }}
                onClick={() => { setStatsCode(result.code); }}
              >
                use last code: {result.code}
              </button>
            </div>
          )}

          {statsError && <div className="error">⚠ {statsError}</div>}

          {stats && (
            <div style={{ animation: "slideIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="divider" />

              <div className="stats-grid">
                <div className="stat-tile">
                  <div className="stat-num">{stats.total_clicks}</div>
                  <div className="stat-desc">total clicks</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-num">{stats.by_country?.length ?? 0}</div>
                  <div className="stat-desc">countries</div>
                </div>
              </div>

              <div className="section-title">clicks over time</div>
              <TimelineChart data={stats.timeline} />

              <div className="section-title">by country</div>
              <BarChart data={stats.by_country} label="country" />

              <div className="section-title">by device</div>
              <BarChart data={stats.by_device} label="device" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
