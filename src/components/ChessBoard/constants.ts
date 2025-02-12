import { Chess } from "chess.js";

export const STORAGE_KEY = "chess-game-state";

export const DEFAULT_STATE = {
  fen: new Chess().fen(),
  playerColor: "w",
  gameTime: 0,
  whiteTime: 0,
  blackTime: 0,
  difficulty: "beginner",
  gameStarted: false,
  history: [{ fen: new Chess().fen(), lastMove: null }],
  currentMove: 1,
  lastMove: null,
};

export const DIFFICULTY_LEVELS = {
  beginner: 2,
  easy: 5,
  intermediate: 8,
  advanced: 11,
  hard: 14,
  expert: 17,
  master: 20,
  grandmaster: 23,
} as const;
