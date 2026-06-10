"use client";

import { getJoinUrl } from "@/lib/join-url";
import { useCallback, useMemo, useState } from "react";
import QRCode from "react-qr-code";

type Props = {
  pin: string;
};

export function InvitePanel({ pin }: Props) {
  const [copied, setCopied] = useState<"link" | "pin" | null>(null);
  const [showInlineQr, setShowInlineQr] = useState(false);
  const [fullscreenQr, setFullscreenQr] = useState(false);

  const joinUrl = useMemo(() => getJoinUrl(pin), [pin]);

  const copy = useCallback(async (text: string, kind: "link" | "pin") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  return (
    <>
      <div className="rounded-2xl bg-white/10 p-4">
        <h3 className="mb-3 font-bold text-white">Invite players</h3>
        <p className="mb-3 text-sm text-white/60">
          Share the link or QR code — players enter their nickname and join. They can also enter the
          PIN manually at{" "}
          <span className="text-white/80">/join</span>.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy(joinUrl, "link")}
            className="rounded-xl bg-[#1368CE] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
          >
            {copied === "link" ? "Copied!" : "Copy invite link"}
          </button>
          <button
            type="button"
            onClick={() => copy(pin, "pin")}
            className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25"
          >
            {copied === "pin" ? "Copied!" : "Copy PIN"}
          </button>
          <button
            type="button"
            onClick={() => setShowInlineQr((v) => !v)}
            className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25"
          >
            {showInlineQr ? "Hide QR" : "Show QR"}
          </button>
          <button
            type="button"
            onClick={() => setFullscreenQr(true)}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500"
          >
            QR fullscreen
          </button>
        </div>

        {showInlineQr && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-white p-4">
            <QRCode value={joinUrl} size={160} level="M" />
            <p className="font-mono text-lg font-black tracking-widest text-[#46178f]">{pin}</p>
            <p className="text-xs text-gray-500">Scan to join with PIN pre-filled</p>
          </div>
        )}
      </div>

      {fullscreenQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setFullscreenQr(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Join game QR code"
        >
          <div
            className="relative flex max-w-md flex-col items-center rounded-3xl bg-white px-8 py-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenQr(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 hover:bg-gray-200"
              aria-label="Close"
            >
              ×
            </button>

            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
              Scan to join
            </p>
            <p className="mb-6 text-center text-lg font-bold text-[#46178f]">Answerini</p>

            <div className="rounded-2xl border-4 border-[#46178f]/20 p-4">
              <QRCode value={joinUrl} size={280} level="M" />
            </div>

            <p className="mt-6 font-mono text-4xl font-black tracking-[0.35em] text-[#46178f]">
              {pin}
            </p>
            <p className="mt-2 max-w-xs text-center text-sm text-gray-500 break-all">
              {joinUrl}
            </p>

            <button
              type="button"
              onClick={() => setFullscreenQr(false)}
              className="mt-8 rounded-xl bg-[#46178f] px-8 py-3 font-bold text-white hover:bg-[#5a1fb3]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
