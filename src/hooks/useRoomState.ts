"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import type { PublicRoomState } from "@/lib/types";

export function useRoomState(pin: string | null) {
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const versionRef = useRef(0);

  const fetchState = useCallback(async () => {
    if (!pin) return;
    try {
      const res = await fetch(`/api/rooms/${pin}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Room not found");
        return;
      }
      const data = (await res.json()) as PublicRoomState;
      setState((prev) => {
        if (prev?.version === data.version && prev) return prev;
        versionRef.current = data.version;
        return data;
      });
      setError(null);
    } catch {
      setError("Connection lost. Retrying…");
    }
  }, [pin]);

  useEffect(() => {
    if (!pin) return;
    fetchState();
    const id = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pin, fetchState]);

  return { state, error, refresh: fetchState };
}

export function useSession(key: string, type: "local" | "session" = "local") {
  const [value, setValue] = useState<string | null>(null);
  const storage = type === "session" ? sessionStorage : localStorage;

  useEffect(() => {
    setValue(storage.getItem(key));
  }, [key, storage]);

  const save = (v: string) => {
    storage.setItem(key, v);
    setValue(v);
  };

  const remove = () => {
    storage.removeItem(key);
    setValue(null);
  };

  return { value, save, remove };
}
