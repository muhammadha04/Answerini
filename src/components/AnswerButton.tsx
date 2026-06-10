"use client";

import { KAHOOT_COLORS, ANSWER_SHAPES } from "@/lib/constants";

const COLORS = Object.values(KAHOOT_COLORS);

type Props = {
  text: string;
  index: number;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  showResult?: boolean;
  onClick?: () => void;
  compact?: boolean;
};

export function AnswerButton({
  text,
  index,
  selected,
  correct,
  wrong,
  disabled,
  showResult,
  onClick,
  compact,
}: Props) {
  const color = COLORS[index % COLORS.length];
  const shape = ANSWER_SHAPES[index % ANSWER_SHAPES.length];

  let opacity = disabled && !selected ? 0.5 : 1;
  if (showResult && !correct && !wrong) opacity = 0.4;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: color, opacity }}
      className={`relative flex items-center gap-3 rounded-xl text-left font-bold text-white shadow-lg transition-transform ${
        compact ? "p-3 text-sm" : "p-4 text-base md:p-5 md:text-lg"
      } ${!disabled ? "hover:scale-[1.02] active:scale-95 cursor-pointer" : "cursor-default"} ${
        selected ? "ring-4 ring-white ring-offset-2 ring-offset-[#46178f]" : ""
      } ${correct ? "ring-4 ring-green-300" : ""} ${wrong ? "ring-4 ring-red-400" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-md bg-black/20 font-black ${
          compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-lg"
        }`}
      >
        {shape}
      </span>
      <span className="flex-1">{text}</span>
      {showResult && correct && <span className="text-2xl">✓</span>}
      {showResult && wrong && <span className="text-2xl">✗</span>}
    </button>
  );
}

export function getAnswerColor(index: number): string {
  return COLORS[index % COLORS.length];
}
