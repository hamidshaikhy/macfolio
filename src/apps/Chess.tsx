import { useEffect, useMemo, useRef, useState } from "react";
import { Chess as Game, type Square, type PieceSymbol } from "chess.js";
import {
  RotateCcw,
  RefreshCw,
  ArrowDownUp,
  Download,
  Cpu,
  Users,
} from "lucide-react";
import { downloadText } from "../lib/download";
import { asset } from "../lib/assets";
import { useMusic } from "../state/music";
import { Play, Pause } from "lucide-react";
type Mode = "computer" | "local";
function loadGame() {
  const game = new Game();
  try {
    const saved = localStorage.getItem("hamidos.chess.v1");
    if (saved) game.loadPgn(JSON.parse(saved).pgn);
  } catch {
    /* invalid or old session: start with a legal initial board */
  }
  return game;
}
function initialMode(): Mode {
  try {
    return JSON.parse(localStorage.getItem("hamidos.chess.v1") || "{}").mode ===
      "local"
      ? "local"
      : "computer";
  } catch {
    return "computer";
  }
}
const names: Record<string, string> = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king",
};
export default function Chess() {
  const [game] = useState(() => ({ current: loadGame() }));
  const [fen, setFen] = useState(game.current.fen());
  const [mode, setMode] = useState<Mode>(initialMode);
  const [level, setLevel] = useState(2);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const playing = useMusic(s => s.playing);
  const toggle = useMusic(s => s.toggle);
  const boardRef = useRef<HTMLDivElement>(null);
  const g = game.current;
  const history = g.history({ verbose: true });
  const last = history.at(-1);
  const legal = useMemo(
    () =>
      selected ? new Game(fen).moves({ square: selected, verbose: true }) : [],
    [selected, fen],
  );
  const update = () => {
    setFen(g.fen());
    setSelected(null);
    setPromotion(null);
    setError("");
  };
  useEffect(() => {
    try {
      localStorage.setItem(
        "hamidos.chess.v1",
        JSON.stringify({ pgn: game.current.pgn(), mode }),
      );
    } catch {
      /* browser storage can be unavailable */
    }
  }, [fen, mode]);
  useEffect(() => {
    if (mode !== "computer" || g.turn() !== "b" || g.isGameOver()) {
      setThinking(false);
      return;
    }
    setThinking(true);
    let cancelled = false;
    let worker: Worker;
    try {
      worker = new Worker(new URL("../lib/chess.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      setThinking(false);
      setError("Computer is unavailable. Switch to two players to continue.");
      return;
    }
    worker.onmessage = (
      e: MessageEvent<{ fen: string; san: string | null; error?: string }>,
    ) => {
      if (cancelled || e.data.fen !== game.current.fen()) return;
      if (e.data.san) {
        try {
          game.current.move(e.data.san);
          setFen(game.current.fen());
          setSelected(null);
        } catch {
          setError("Computer move failed. Undo or start a new game.");
        }
      } else if (e.data.error) setError(e.data.error);
      setThinking(false);
      worker.terminate();
    };
    worker.onerror = () => {
      if (!cancelled) {
        setThinking(false);
        setError("Computer is unavailable. Switch to two players to continue.");
      }
    };
    worker.postMessage({ fen, depth: level });
    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, [fen, mode, level]);
  function move(from: Square, to: Square, piece?: PieceSymbol) {
    try {
      g.move({ from, to, promotion: piece ?? "q" });
      update();
    } catch {
      setError("Choose a highlighted square.");
    }
  }
  function choose(square: Square) {
    if (g.isGameOver() || thinking || (mode === "computer" && g.turn() === "b"))
      return;
    const target = legal.find((m) => m.to === square);
    if (selected && target) {
      if (target.flags.includes("p"))
        setPromotion({ from: selected, to: square });
      else move(selected, square);
      return;
    }
    const p = g.get(square);
    setSelected(p?.color === g.turn() ? square : null);
    setError("");
  }
  const status = g.isCheckmate()
    ? `${g.turn() === "w" ? "Black" : "White"} wins by checkmate`
    : g.isStalemate()
      ? "Draw by stalemate"
      : g.isThreefoldRepetition()
        ? "Draw by repetition"
        : g.isInsufficientMaterial()
          ? "Draw — insufficient material"
          : g.isDraw()
            ? "Draw"
            : thinking
              ? "Computer is thinking…"
              : `${g.turn() === "w" ? "White" : "Black"} to move${g.isCheck() ? " · Check" : ""}`;
  const squares = Array.from({ length: 64 }, (_, i) => {
    const index = flipped ? 63 - i : i;
    return `${"abcdefgh"[index % 8]}${8 - Math.floor(index / 8)}` as Square;
  });
  return (
    <div className="chess-app">
      <main className="chess-main">
        <div className="chess-player">
          <span className="player-piece black">♚</span>
          <div>
            <strong>{mode === "computer" ? "Computer" : "Black"}</strong>
            <small>
              {mode === "computer"
                ? ["", "Casual", "Balanced", "Challenging"][level]
                : "Player two"}
            </small>
          </div>
          <span className="player-indicator">
            {g.turn() === "b" ? "●" : ""}
          </span>
        </div>
        <div className="board-wrap">
          <div
            className="chess-board"
            ref={boardRef}
            role="group"
            aria-label="Chess board"
            onKeyDown={(e) => {
              const el = e.target as HTMLElement;
              const idx = squares.indexOf(el.dataset.square as Square);
              if (idx < 0) return;
              const offset = {
                ArrowLeft: -1,
                ArrowRight: 1,
                ArrowUp: -8,
                ArrowDown: 8,
              }[e.key];
              if (offset) {
                e.preventDefault();
                const next = Math.min(63, Math.max(0, idx + offset));
                boardRef.current
                  ?.querySelector<HTMLButtonElement>(
                    `[data-square="${squares[next]}"]`,
                  )
                  ?.focus();
              }
            }}
          >
            {squares.map((s, i) => {
              const p = g.get(s);
              const isLegal = legal.some((m) => m.to === s);
              return (
                <button
                  key={s}
                  data-square={s}
                  aria-label={`${s}${p ? " " + (p.color === "w" ? "white" : "black") + " " + names[p.type] : ""}${isLegal ? " legal move" : ""}`}
                  aria-pressed={selected === s}
                  className={`square ${(Number(s[1]) + "abcdefgh".indexOf(s[0])) % 2 === 1 ? "dark" : "light"} ${selected === s ? "piece-selected" : ""} ${last?.from === s || last?.to === s ? "last-move" : ""} ${p?.type === "k" && p.color === g.turn() && g.isCheck() ? "in-check" : ""}`}
                  onClick={() => choose(s)}
                >
                  {i % 8 === 0 && <span className="rank-label">{s[1]}</span>}
                  {i >= 56 && <span className="file-label">{s[0]}</span>}
                  {p && (
                    <img
                      src={asset(`assets/chess/${p.color}${p.type.toUpperCase()}.svg`)}
                      alt=""
                      draggable={false}
                    />
                  )}{" "}
                  {isLegal && (
                    <span className={p ? "legal-capture" : "legal-dot"} />
                  )}
                </button>
              );
            })}
          </div>
          {promotion && (
            <div
              className="promotion-dialog"
              role="dialog"
              aria-label="Choose promotion piece"
            >
              <strong>Promote pawn</strong>
              <div>
                {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                  <button
                    key={p}
                    aria-label={`Promote to ${names[p]}`}
                    onClick={() => move(promotion.from, promotion.to, p)}
                  >
                    <img
                      src={asset(`assets/chess/${g.turn()}${p.toUpperCase()}.svg`)}
                      alt=""
                    />
                  </button>
                ))}
              </div>
              <button onClick={() => setPromotion(null)}>Cancel</button>
            </div>
          )}
        </div>
        <div className="chess-player">
          <span className="player-piece white">♔</span>
          <div>
            <strong>{mode === "computer" ? "You" : "White"}</strong>
            <small>
              {mode === "computer" ? "Playing as white" : "Player one"}
            </small>
          </div>
          <span className="player-indicator">
            {g.turn() === "w" ? "●" : ""}
          </span>
        </div>
      </main>
      <aside className="chess-sidebar">
        <h2>Chess</h2>
        <div className="segmented">
          <button
            className={mode === "computer" ? "selected" : ""}
            aria-pressed={mode === "computer"}
            onClick={() => {
              setMode("computer");
              setSelected(null);
            }}
          >
            <Cpu size={15} /> Computer
          </button>
          <button
            className={mode === "local" ? "selected" : ""}
            aria-pressed={mode === "local"}
            onClick={() => {
              setMode("local");
              setSelected(null);
            }}
          >
            <Users size={15} /> 2 players
          </button>
        </div>
        {mode === "computer" && (
          <label className="chess-level">
            Level
            <select
              aria-label="Computer level"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              <option value="1">Casual</option>
              <option value="2">Balanced</option>
              <option value="3">Challenging</option>
            </select>
          </label>
        )}
        <div className="chess-status" role="status">
          <span className={thinking ? "thinking-dot" : "turn-dot"} />
          {status}
        </div>
        {error && (
          <p role="alert" className="chess-error">
            {error}
          </p>
        )}
        <div className="chess-actions">
          <button
            title="Undo"
            aria-label="Undo move"
            disabled={!history.length}
            onClick={() => {
              g.undo();
              if (mode === "computer" && g.turn() === "b") g.undo();
              update();
            }}
          >
            <RotateCcw size={18} />
          </button>
          <button
            title="Flip board"
            aria-label="Flip board"
            onClick={() => setFlipped((v) => !v)}
          >
            <ArrowDownUp size={18} />
          </button>
          <button
            title="Export PGN"
            aria-label="Export chess game"
            onClick={() => downloadText(g.pgn(), "hamidos-game.pgn")}
          >
            <Download size={18} />
          </button>
          <button
            title="New game"
            aria-label="New chess game"
            onClick={() => {
              g.reset();
              update();
            }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="move-list">
          <div className="move-list-title">
            MOVES <span>{history.length}</span>
          </div>
          {history.length ? (
            Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
              <div className="move-pair" key={i}>
                <span>{i + 1}.</span>
                <strong>{history[i * 2]?.san}</strong>
                <strong>{history[i * 2 + 1]?.san}</strong>
              </div>
            ))
          ) : (
            <p>
              White moves first.
              <br />
              Select a piece to see legal moves.
            </p>
          )}
        </div>
        <div className="chess-foot">
          <span className="persian" dir="rtl">
            دونفره روی یک دستگاه
          </span>
          <button
            aria-label={playing ? "Pause game music" : "Play game music"}
            onClick={() => void toggle()}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />} Riversea
          </button>
        </div>
      </aside>
    </div>
  );
}
