export const KAHOOT_COLORS = {
  red: "#E21B3C",
  blue: "#1368CE",
  yellow: "#D89E00",
  green: "#26890C",
  purple: "#864CBF",
  orange: "#FF6600",
} as const;

export const ANSWER_SHAPES = ["▲", "◆", "●", "■", "★", "⬡"] as const;

export const DEFAULT_SETTINGS = {
  questionTimeLimit: 20,
  showLeaderboardAfterEach: true,
  shuffleAnswers: true,
  maxPlayers: 500,
} as const;

export const COUNTDOWN_SECONDS = 3;
export const LEADERBOARD_TOP_N = 5;
export const MAX_POINTS = 1000;
export const MIN_POINTS = 500;
export const POLL_INTERVAL_MS = 800;
export const PLAYER_TIMEOUT_MS = 60_000;
export const ROOM_TTL_SECONDS = 60 * 60 * 6;
