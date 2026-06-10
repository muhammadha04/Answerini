import type { AnswerOption, Question, RoomSettings } from "./types";

export type SavedGameRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  settings: RoomSettings;
  fixed_pin: string | null;
  short_link: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedQuestionRow = {
  id: string;
  game_id: string;
  sort_order: number;
  text: string;
  options: AnswerOption[];
  correct_option_id: string;
  time_limit: number;
  image_url: string | null;
  created_at: string;
};

export type SavedGameWithQuestions = SavedGameRow & {
  saved_questions: SavedQuestionRow[];
};

export function rowToQuestion(row: SavedQuestionRow): Question {
  return {
    id: row.id,
    text: row.text,
    options: row.options,
    correctOptionId: row.correct_option_id,
    timeLimit: row.time_limit,
    imageUrl: row.image_url ?? undefined,
  };
}

export function questionCount(game: SavedGameWithQuestions): number {
  return game.saved_questions?.length ?? 0;
}
