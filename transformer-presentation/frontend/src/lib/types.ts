export type Phase = "waiting" | "live" | "ended";
export type Role = "participant" | "presenter" | "screen";

export interface PublicQuestion {
  id: string;
  slide: number;
  prompt: string;
  options: string[];
}

export interface AnswerRecord {
  choice: number;
  correct: boolean;
  correctChoice: number;
  explanation: string;
}

export interface Me {
  id: string;
  username: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, AnswerRecord>;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  answered: number;
  rank: number;
  badge: string;
  online: boolean;
}

export interface Stats {
  slide: number;
  answered: Record<string, number>;
  participantCount: number;
  distribution?: Record<string, number[]>;
  correct?: Record<string, number>;
}

export interface LiveState {
  connected: boolean;
  phase: Phase;
  slide: number;
  totalSlides: number;
  startsAt: number | null;
  replayNonce: number;
  totalQuestions: number;
  questions: PublicQuestion[];
  /** serverTime - Date.now(), used to keep countdowns in sync across devices */
  clockOffset: number;
  participantCount: number;
  names: string[];
  me: Me | null;
  stats: Stats | null;
  leaderboard: LeaderboardEntry[];
  error: string | null;
}

export const initialLiveState: LiveState = {
  connected: false,
  phase: "waiting",
  slide: 0,
  totalSlides: 12,
  startsAt: null,
  replayNonce: 0,
  totalQuestions: 14,
  questions: [],
  clockOffset: 0,
  participantCount: 0,
  names: [],
  me: null,
  stats: null,
  leaderboard: [],
  error: null,
};
