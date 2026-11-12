import { useCallback, useEffect, useRef, useState } from "react";
import { initialLiveState, type AnswerRecord, type LiveState, type Role } from "./types";

interface Options {
  role: Role;
  token?: string;
  presenterKey?: string;
  /** Called when the server rejects our credentials or wipes the session. */
  onInvalidSession?: () => void;
}

export interface AnswerResult extends AnswerRecord {
  questionId: string;
  duplicate: boolean;
}

/**
 * Keeps a WebSocket open to the presentation hub, reconnecting with backoff,
 * and folds server messages into a single LiveState object.
 */
export function useLiveSession({ role, token, presenterKey, onInvalidSession }: Options) {
  const [state, setState] = useState<LiveState>(initialLiveState);
  const wsRef = useRef<WebSocket | null>(null);
  const invalidRef = useRef(onInvalidSession);
  invalidRef.current = onInvalidSession;
  const resultListeners = useRef(new Set<(r: AnswerResult) => void>());

  const enabled = role === "screen" || (role === "participant" && !!token) || (role === "presenter" && !!presenterKey);

  useEffect(() => {
    if (!enabled) return;
    let closedByUs = false;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const params = new URLSearchParams({ role });
      if (token) params.set("token", token);
      if (presenterKey) params.set("key", presenterKey);
      const ws = new WebSocket(`${proto}://${location.host}/ws?${params}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setState((s) => ({ ...s, connected: true, error: null }));
        pingTimer = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('{"type":"ping"}'), 25_000);
      };

      ws.onmessage = (ev) => {
        let msg: any;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "state":
            setState((s) => ({
              ...s,
              phase: msg.phase,
              slide: msg.slide,
              totalSlides: msg.totalSlides,
              startsAt: msg.startsAt,
              replayNonce: msg.replayNonce,
              totalQuestions: msg.totalQuestions,
              questions: msg.questions,
              clockOffset: msg.serverTime - Date.now(),
            }));
            break;
          case "presence":
            setState((s) => ({ ...s, participantCount: msg.participantCount, names: msg.names }));
            break;
          case "me":
            setState((s) => ({ ...s, me: msg }));
            break;
          case "stats":
            setState((s) => ({ ...s, stats: msg }));
            break;
          case "leaderboard":
            setState((s) => ({ ...s, leaderboard: msg.entries }));
            break;
          case "answer_result":
            resultListeners.current.forEach((fn) => fn(msg as AnswerResult));
            break;
          case "reset":
            closedByUs = true;
            invalidRef.current?.();
            break;
          case "error":
            if (msg.code === "invalid_token" || msg.code === "unauthorized") {
              closedByUs = true;
              invalidRef.current?.();
            }
            setState((s) => ({ ...s, error: msg.message ?? "Something went wrong" }));
            break;
        }
      };

      ws.onclose = () => {
        clearInterval(pingTimer);
        setState((s) => ({ ...s, connected: false }));
        if (closedByUs) return;
        const delay = Math.min(1000 * 2 ** retry, 8000) + Math.random() * 300;
        retry += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      wsRef.current?.close();
    };
  }, [enabled, role, token, presenterKey]);

  const send = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  const onAnswerResult = useCallback((fn: (r: AnswerResult) => void) => {
    resultListeners.current.add(fn);
    return () => {
      resultListeners.current.delete(fn);
    };
  }, []);

  return { state, send, onAnswerResult };
}

/** Milliseconds remaining until `target`, ticking every 250 ms, corrected for server clock offset. */
export function useCountdown(target: number | null, clockOffset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  return Math.max(0, target - (now + clockOffset));
}
