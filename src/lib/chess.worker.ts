import { findBestMove } from "./chess-engine";
self.onmessage = (e: MessageEvent<{ fen: string; depth: number }>) => {
  try {
    self.postMessage({
      fen: e.data.fen,
      ...findBestMove(e.data.fen, e.data.depth, 1400),
    });
  } catch {
    self.postMessage({
      fen: e.data.fen,
      san: null,
      error: "Engine could not evaluate this position.",
    });
  }
};
