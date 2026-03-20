import Link from "next/link";

const QR_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1],
  [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
  [1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const BROKEN_CELLS = new Set([
  "8-9",
  "8-10",
  "9-8",
  "9-11",
  "10-8",
  "10-9",
  "10-10",
  "11-8",
  "11-11",
  "12-8",
  "12-9",
  "12-10",
  "12-11",
  "8-13",
  "9-13",
  "9-14",
  "10-13",
  "11-15",
  "12-13",
  "12-14",
  "12-15",
  "8-17",
  "8-18",
  "9-17",
  "9-19",
  "10-17",
  "10-18",
  "11-19",
  "12-17",
  "12-18",
  "12-19",
]);

function QRDisplay() {
  const cols = QR_PATTERN[0].length;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "2px",
        width: "100%",
        aspectRatio: "1",
      }}
    >
      {QR_PATTERN.map((row, r) =>
        row.map((cell, c) => {
          const broken = BROKEN_CELLS.has(`${r}-${c}`);
          return (
            <div
              key={`${r}-${c}`}
              style={{
                background: broken
                  ? "#e8380d"
                  : cell === 1
                    ? "#1a1a1a"
                    : "transparent",
                borderRadius: "1.5px",
                boxShadow: broken ? "0 0 3px rgba(232,56,13,0.5)" : "none",
                animation: broken ? "redpulse 2s ease-in-out infinite" : "none",
              }}
            />
          );
        }),
      )}
    </div>
  );
}

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');

        :root {
          --bg: #f5f0e8;
          --surface: #ffffff;
          --fg: #1a1a1a;
          --accent: #e8380d;
          --accent-dim: rgba(232,56,13,0.1);
          --accent-border: rgba(232,56,13,0.25);
          --border: #ddd6c8;
          --muted: #8a8070;
          --mono: 'IBM Plex Mono', monospace;
          --display: 'Syne', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100svh;
          background: var(--bg);
          background-image:
            radial-gradient(circle at 15% 85%, rgba(232,56,13,0.05) 0%, transparent 45%),
            radial-gradient(circle at 85% 15%, rgba(26,26,26,0.03) 0%, transparent 45%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1.25rem;
          font-family: var(--mono);
          position: relative;
          overflow: hidden;
        }

        .root::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, #c8bfb0 1px, transparent 1px);
          background-size: 22px 22px;
          opacity: 0.4;
          pointer-events: none;
        }

        @keyframes redpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-sweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          8%   { opacity: 0.9; }
          92%  { opacity: 0.9; }
          100% { transform: translateY(700%); opacity: 0; }
        }

        /* ── Card ── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem 1.5rem 1.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07);
          position: relative;
          z-index: 1;
          animation: fadein 0.5s ease both;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* QR corner markers on card */
        .card::before, .card::after {
          content: ''; position: absolute;
          width: 20px; height: 20px;
          border-color: var(--accent); border-style: solid;
        }
        .card::before { top: -1px; left: -1px; border-width: 3px 0 0 3px; border-radius: 8px 0 0 0; }
        .card::after  { bottom: -1px; right: -1px; border-width: 0 3px 3px 0; border-radius: 0 0 8px 0; }
        .c-tr { position: absolute; top: -1px; right: -1px; width: 20px; height: 20px; border: 3px solid var(--accent); border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
        .c-bl { position: absolute; bottom: -1px; left: -1px; width: 20px; height: 20px; border: 3px solid var(--accent); border-right: none; border-top: none; border-radius: 0 0 0 8px; }

        /* ── Mobile: stacked; Desktop: side-by-side ── */
        .inner {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        @media (min-width: 560px) {
          .card {
            max-width: 780px;
            padding: 2.5rem 2.5rem 2rem;
          }
          .inner {
            flex-direction: row;
            align-items: center;
            gap: 2.5rem;
          }
        }

        /* ── QR Panel ── */
        .qr-panel {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          max-width: 160px;
        }

        @media (min-width: 560px) {
          .qr-panel { width: 190px; max-width: 190px; }
        }

        .qr-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          overflow: hidden;
        }
        .qr-frame::before, .qr-frame::after {
          content: ''; position: absolute;
          width: 16px; height: 16px;
          border-color: var(--fg); border-style: solid; z-index: 2;
        }
        .qr-frame::before { top: 5px; left: 5px; border-width: 2px 0 0 2px; border-radius: 2px 0 0 0; }
        .qr-frame::after  { bottom: 5px; right: 5px; border-width: 0 2px 2px 0; border-radius: 0 0 2px 0; }
        .qf-tr { position: absolute; top: 5px; right: 5px; width: 16px; height: 16px; border: 2px solid var(--fg); border-left: none; border-bottom: none; border-radius: 0 2px 0 0; z-index: 2; }
        .qf-bl { position: absolute; bottom: 5px; left: 5px; width: 16px; height: 16px; border: 2px solid var(--fg); border-right: none; border-top: none; border-radius: 0 0 0 2px; z-index: 2; }

        .scan-beam {
          position: absolute; left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--accent) 40%, var(--accent) 60%, transparent);
          box-shadow: 0 0 8px rgba(232,56,13,0.6), 0 0 20px rgba(232,56,13,0.3);
          z-index: 3; top: 0;
          animation: scan-sweep 3s ease-in-out infinite;
        }

        .qr-status {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--accent);
          display: flex; align-items: center; gap: 5px;
        }
        .qr-status::before {
          content: ''; display: block; width: 5px; height: 5px;
          background: var(--accent); border-radius: 50%;
          animation: redpulse 1.4s ease-in-out infinite;
        }

        /* ── Info Panel ── */
        .info {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 560px) {
          .info { align-items: flex-start; text-align: left; }
        }

        .label {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 0.35rem;
        }

        .big-code {
          font-family: var(--display);
          font-size: clamp(3.5rem, 14vw, 5.5rem);
          font-weight: 800; line-height: 0.9;
          color: transparent;
          -webkit-text-stroke: 2px var(--accent);
          letter-spacing: -0.04em;
          margin-bottom: 0.6rem;
          position: relative;
        }
        .big-code-blur {
          position: absolute; inset: 0;
          -webkit-text-stroke: 0; color: var(--accent);
          opacity: 0.1; filter: blur(14px);
          pointer-events: none; user-select: none;
          font-family: var(--display); font-size: inherit;
          font-weight: inherit; line-height: inherit; letter-spacing: inherit;
        }

        h1 {
          font-family: var(--display); font-size: 1.2rem; font-weight: 700;
          color: var(--fg); letter-spacing: -0.02em; margin-bottom: 0.4rem;
        }

        .subtitle {
          font-size: 0.75rem; color: var(--muted); line-height: 1.65;
          margin-bottom: 1.25rem; max-width: 300px;
        }

        .divider {
          width: 100%; height: 1px;
          background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
          margin-bottom: 1rem;
        }

        .actions {
          display: flex; flex-direction: column; gap: 8px; width: 100%;
        }
        @media (min-width: 380px) {
          .actions { flex-direction: row; }
        }

        .btn-p {
          flex: 1; display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; height: 40px; padding: 0 16px;
          background: var(--fg); color: #fff;
          font-family: var(--mono); font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
          border-radius: 8px; text-decoration: none; transition: all 0.15s;
        }
        .btn-p:hover { background: #333; transform: translateY(-1px); }

        .btn-s {
          flex: 1; display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; height: 40px; padding: 0 16px;
          background: transparent; color: var(--fg);
          font-family: var(--mono); font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
          border: 1.5px solid var(--border); border-radius: 8px;
          text-decoration: none; transition: all 0.15s;
        }
        .btn-s:hover { border-color: var(--fg); background: var(--bg); transform: translateY(-1px); }

        .foot {
          margin-top: 1rem; font-size: 0.58rem; color: #b0a898;
          letter-spacing: 0.04em; text-align: center;
        }
        @media (min-width: 560px) { .foot { text-align: left; } }

        .err-ref {
          position: absolute; bottom: 10px; right: 14px;
          font-size: 0.55rem; color: #ccc4b8; font-family: var(--mono);
        }
      `}</style>

      <main className="root">
        <div className="card">
          <div className="c-tr" />
          <div className="c-bl" />

          <div className="inner">
            {/* QR */}
            <div className="qr-panel">
              <div className="qr-frame">
                <div className="qf-tr" />
                <div className="qf-bl" />
                <div className="scan-beam" />
                <QRDisplay />
              </div>
              <p className="qr-status">Decode failed</p>
            </div>

            {/* Info */}
            <div className="info">
              <p className="label">HTTP · 404 · CLIENT_ERROR</p>
              <div className="big-code" aria-hidden>
                404
                <div className="big-code-blur">404</div>
              </div>
              <h1>Page not found</h1>
              <p className="subtitle">
                This code doesn&apos;t resolve to anything. The route may have
                moved, been removed, or never existed.
              </p>
              <div className="divider" />
              <div className="actions">
                <Link href="/dashboard" className="btn-p">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Dashboard
                </Link>
                <Link href="/" className="btn-s">
                  Go Home
                </Link>
              </div>
              <p className="foot">
                If this is a mistake, contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
