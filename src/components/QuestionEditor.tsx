"use client";

import { useState } from "react";

type Props = {
  onAdd: (question: {
    text: string;
    options: { text: string }[];
    correctIndex: number;
    timeLimit: number;
  }) => Promise<void>;
};

export function QuestionEditor({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  const updateOption = (i: number, value: string) => {
    const next = [...options];
    next[i] = value;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({
        text,
        options: options.map((o) => ({ text: o })),
        correctIndex,
        timeLimit,
      });
      setText("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white/5 p-5">
      <h3 className="text-lg font-bold text-white">Add Question</h3>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Question text"
        className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-400 outline-none"
        required
      />
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              className="h-4 w-4 accent-green-400"
            />
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Answer ${i + 1}`}
              className="flex-1 rounded-xl border-0 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>
        ))}
        <p className="text-xs text-white/50">Select the radio button for the correct answer</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-white/70">Time limit (sec)</label>
        <input
          type="number"
          min={5}
          max={120}
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          className="w-20 rounded-lg bg-white/10 px-3 py-1 text-white outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-400 disabled:opacity-50"
      >
        {loading ? "Adding…" : "+ Add Question"}
      </button>
    </form>
  );
}
