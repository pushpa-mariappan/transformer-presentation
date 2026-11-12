/**
 * The running example used on every slide: "The bank approved the loan."
 *
 * Token boundaries and IDs are ILLUSTRATIVE. They resemble what a BPE tokenizer
 * produces (a leading space is part of the token), but are not the exact output
 * of any specific tokenizer.
 */
export const SENTENCE = "The bank approved the loan.";

export interface Token {
  text: string; // display text
  raw: string; // text including leading space, as a BPE-style tokenizer would see it
  id: number; // illustrative token ID
  color: string;
}

export const TOKENS: Token[] = [
  { text: "The", raw: "The", id: 1032, color: "#93c5fd" },
  { text: "bank", raw: " bank", id: 4521, color: "#22d3ee" },
  { text: "approved", raw: " approved", id: 8807, color: "#a78bfa" },
  { text: "the", raw: " the", id: 262, color: "#7dd3fc" },
  { text: "loan", raw: " loan", id: 7339, color: "#f472b6" },
  { text: ".", raw: ".", id: 13, color: "#94a3b8" },
];

/** Deterministic pseudo-random vector in [-1, 1] so every participant sees the same numbers. */
export function seededVector(seed: number, dim: number): number[] {
  let x = (seed * 9301 + 49297) % 233280;
  const out: number[] = [];
  for (let i = 0; i < dim; i++) {
    x = (x * 9301 + 49297) % 233280;
    out.push(Math.round(((x / 233280) * 2 - 1) * 100) / 100);
  }
  return out;
}

export const EMBED_DIM = 8;
export const EMBEDDINGS: number[][] = TOKENS.map((t) => seededVector(t.id, EMBED_DIM));

/** Sinusoidal positional encoding from "Attention Is All You Need" (Vaswani et al., 2017). */
export function sinusoidalPE(pos: number, dim: number): number[] {
  return Array.from({ length: dim }, (_, i) => {
    const k = Math.floor(i / 2);
    const angle = pos / Math.pow(10000, (2 * k) / dim);
    return Math.round((i % 2 === 0 ? Math.sin(angle) : Math.cos(angle)) * 100) / 100;
  });
}

export function softmax(xs: number[], temperature = 1): number[] {
  const scaled = xs.map((x) => x / temperature);
  const m = Math.max(...scaled);
  const exps = scaled.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const fmt = (n: number, digits = 2) => (Number.isFinite(n) ? n.toFixed(digits) : n > 0 ? "∞" : "−∞");
