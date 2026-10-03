import { useRef, useState } from "react";
import "./App.css";

// Every fill has at least 4.5:1 contrast against white text.
const COLORS = [
  "#7d387d",
  "#a65a45",
  "#27474e",
  "#a63f8e",
  "#756a22",
  "#3e6b73",
];
const SPIN_MS = 4000;
const R = 150;

const point = (deg, r) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [R + r * Math.cos(rad), R + r * Math.sin(rad)];
};

const truncate = (s) => (s.length > 14 ? s.slice(0, 13) + "…" : s);

function Wheel({ chores, rotation, spinning }) {
  const n = chores.length;
  const seg = 360 / n;
  return (
    <svg
      className="wheel"
      viewBox={`0 0 ${R * 2} ${R * 2}`}
      aria-hidden="true"
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: spinning
          ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.6, 0.1, 1)`
          : "none",
      }}
    >
      {n === 0 && <circle cx={R} cy={R} r={R - 2} fill="#5a6b6f" />}
      {n === 1 && <circle cx={R} cy={R} r={R - 2} fill={COLORS[0]} />}
      {n > 1 &&
        chores.map((c, i) => {
          const [x1, y1] = point(i * seg, R - 2);
          const [x2, y2] = point((i + 1) * seg, R - 2);
          return (
            <path
              key={c.id}
              d={`M${R} ${R} L${x1} ${y1} A${R - 2} ${R - 2} 0 ${seg > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
              fill={COLORS[i % COLORS.length]}
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}
      {n > 0 &&
        chores.map((c, i) => (
          <text
            key={c.id}
            x={R + 60}
            y={R}
            transform={`rotate(${n === 1 ? -90 : (i + 0.5) * seg - 90} ${R} ${R})`}
            fill="#fff"
            fontSize="15"
            fontWeight="700"
            dominantBaseline="middle"
          >
            {truncate(c.text)}
          </text>
        ))}
      <circle
        cx={R}
        cy={R}
        r="14"
        fill="#f3efd6"
        stroke="#27474e"
        strokeWidth="3"
      />
    </svg>
  );
}

export default function App() {
  const [chores, setChores] = useState([
    { id: 1, text: "Dishes" },
    { id: 2, text: "Vacuum" },
    { id: 3, text: "Laundry" },
    { id: 4, text: "Take out trash" },
    { id: 5, text: "Water plants" },
  ]);
  const [draft, setDraft] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [status, setStatus] = useState("");
  const nextId = useRef(6);

  const add = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || spinning) return;
    setChores((cs) => [...cs, { id: nextId.current++, text }]);
    setDraft("");
    setWinner(null);
    setStatus(`Added ${text}.`);
  };

  const edit = (id, text) => {
    setChores((cs) => cs.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  const complete = (id) => {
    const c = chores.find((x) => x.id === id);
    setChores((cs) => cs.filter((x) => x.id !== id));
    if (winner === id) setWinner(null);
    setStatus(`Completed ${c.text}. Removed from the wheel.`);
  };

  const spin = () => {
    if (spinning || chores.length === 0) return;
    const n = chores.length;
    const seg = 360 / n;
    const idx = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const center = (idx + 0.5) * seg + jitter;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (((-center - current) % 360) + 360) % 360;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const target = rotation + (reduced ? 0 : 360 * 5) + delta;
    const chosen = chores[idx];
    setWinner(null);
    setStatus("Spinning.");
    setRotation(target);
    if (reduced) {
      setWinner(chosen.id);
      setStatus(`Selected: ${chosen.text}.`);
      return;
    }
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setWinner(chosen.id);
      setStatus(`Selected: ${chosen.text}.`);
    }, SPIN_MS);
  };

  const winnerChore = chores.find((c) => c.id === winner);

  return (
    <main>
      <h1>Chore Wheel</h1>
      <div className="layout">
        <section aria-labelledby="wheel-h" className="wheel-section">
          <h2 id="wheel-h" className="sr-only">
            Wheel
          </h2>
          <div className="wheel-wrap">
            <div className="pointer" aria-hidden="true" />
            <Wheel chores={chores} rotation={rotation} spinning={spinning} />
          </div>
          <button
            type="button"
            className="primary"
            onClick={spin}
            disabled={spinning || chores.length === 0}
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </button>
          {winnerChore && (
            <div className="result">
              <p>
                Your chore: <strong>{winnerChore.text}</strong>
              </p>
              <button type="button" onClick={() => complete(winnerChore.id)}>
                Mark complete
              </button>
            </div>
          )}
          {chores.length === 0 && (
            <p>All chores are done. Add more to keep spinning.</p>
          )}
        </section>

        <section aria-labelledby="list-h">
          <h2 id="list-h">Chores</h2>
          <form onSubmit={add} className="add">
            <label htmlFor="new-chore">New chore</label>
            <input
              id="new-chore"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
          <ul className="chores">
            {chores.map((c) => (
              <li key={c.id}>
                <label htmlFor={`chore-${c.id}`} className="sr-only">
                  Edit chore
                </label>
                <input
                  id={`chore-${c.id}`}
                  value={c.text}
                  disabled={spinning}
                  onChange={(e) => edit(c.id, e.target.value)}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) edit(c.id, "Untitled chore");
                  }}
                />
                <button
                  type="button"
                  disabled={spinning}
                  onClick={() => complete(c.id)}
                >
                  Complete<span className="sr-only"> {c.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>
    </main>
  );
}
