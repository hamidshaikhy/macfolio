import { Chess, type Move } from "chess.js";
const values: Record<string, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 0,
};
export function evaluate(game: Chess) {
  if (game.isCheckmate()) return -100000;
  if (game.isDraw()) return 0;
  let score = 0;
  game.board().forEach((rank, r) =>
    rank.forEach((p, c) => {
      if (!p) return;
      const forward = p.color === "w" ? 6 - r : r - 1;
      const center = 3.5 - Math.abs(c - 3.5) + 3.5 - Math.abs(r - 3.5);
      const position =
        p.type === "p"
          ? forward * 7 + center * 2
          : p.type === "n"
            ? center * 12
            : p.type === "b"
              ? center * 6
              : p.type === "k"
                ? 0
                : center * 2;
      score += (values[p.type] + position) * (p.color === "w" ? 1 : -1);
    }),
  );
  return score * (game.turn() === "w" ? 1 : -1);
}
function ordered(game: Chess): Move[] {
  return game.moves({ verbose: true }).sort((a, b) => {
    const weight = (m: Move) =>
      (m.captured ? 10 * values[m.captured] - values[m.piece] : 0) +
      (m.promotion ? values[m.promotion] : 0) +
      (m.san.includes("+") ? 50 : 0);
    return weight(b) - weight(a);
  });
}
/** Bounded alpha-beta search; runs entirely in a Worker, never on the UI thread. */
export function findBestMove(
  fen: string,
  depth = 2,
  budgetMs = 1000,
): { san: string | null; nodes: number; depth: number } {
  const game = new Chess(fen);
  if (game.isGameOver()) return { san: null, nodes: 0, depth: 0 };
  const start = performance.now();
  let nodes = 0;
  let best = ordered(game)[0].san;
  let completed = 0;
  function search(d: number, alpha: number, beta: number, ply: number): number {
    nodes++;
    if (nodes % 128 === 0 && performance.now() - start > budgetMs)
      throw new Error("budget");
    if (game.isCheckmate()) return -100000 + ply;
    if (game.isDraw()) return 0;
    if (d === 0) return evaluate(game);
    for (const move of ordered(game)) {
      game.move(move);
      let score: number;
      try {
        score = -search(d - 1, -beta, -alpha, ply + 1);
      } finally {
        game.undo();
      }
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }
  for (let d = 1; d <= Math.min(4, depth); d++) {
    let local = best,
      alpha = -Infinity;
    try {
      for (const move of ordered(game)) {
        game.move(move);
        let score: number;
        try {
          score = -search(d - 1, -Infinity, -alpha, 1);
        } finally {
          game.undo();
        }
        if (score > alpha) {
          alpha = score;
          local = move.san;
        }
      }
      best = local;
      completed = d;
    } catch {
      break;
    }
  }
  return { san: best, nodes, depth: completed };
}
