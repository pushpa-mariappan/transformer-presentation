import type { ComponentType } from "react";
import Slide01Intro from "./Slide01Intro";
import Slide02Tokenization from "./Slide02Tokenization";
import Slide03Embeddings from "./Slide03Embeddings";
import Slide04Position from "./Slide04Position";
import Slide05Architecture from "./Slide05Architecture";
import Slide06SelfAttention from "./Slide06SelfAttention";
import Slide07QKV from "./Slide07QKV";
import Slide08MultiHead from "./Slide08MultiHead";
import Slide09Block from "./Slide09Block";
import Slide10Stacking from "./Slide10Stacking";
import Slide11Output from "./Slide11Output";
import Slide12Walkthrough from "./Slide12Walkthrough";

export interface SlideDef {
  kicker: string;
  title: string;
  points: string[];
  Visual: ComponentType;
}

export const SLIDES: SlideDef[] = [
  {
    kicker: "The big picture",
    title: "What Is a Transformer?",
    points: [
      "A neural network architecture for sequences of tokens, introduced in “Attention Is All You Need” (2017).",
      "The backbone of LLMs such as GPT, Claude, Llama and Gemini.",
      "Processes all tokens of the input in parallel, unlike RNNs that go one token at a time.",
      "Self-attention is the core idea: each token decides which other tokens matter to it.",
    ],
    Visual: Slide01Intro,
  },
  {
    kicker: "Step 1 · Text → numbers",
    title: "Tokenization",
    points: [
      "Text is split into tokens: words, sub-words or punctuation.",
      "Each token maps to an integer ID in a fixed vocabulary.",
      "Networks compute on numbers, so token IDs are the model's real input.",
    ],
    Visual: Slide02Tokenization,
  },
  {
    kicker: "Step 2 · IDs → vectors",
    title: "Token Embeddings",
    points: [
      "Each token ID selects one row of a learned embedding matrix.",
      "That row is a vector of d numbers (the embedding dimension).",
      "Training places similar tokens near each other.",
      "The same token always gets the same vector, whatever its context.",
    ],
    Visual: Slide03Embeddings,
  },
  {
    kicker: "Step 3 · Word order",
    title: "Positional Information",
    points: [
      "Attention alone treats the input as an unordered set.",
      "Position is injected so “bank approved loan” ≠ “loan approved bank”.",
      "Added vectors (sinusoidal or learned) or rotations of Q and K (RoPE).",
    ],
    Visual: Slide04Position,
  },
  {
    kicker: "The full map",
    title: "Transformer Architecture",
    points: [
      "Embeddings + position → N identical blocks → output projection → softmax.",
      "Each block: attention + feed-forward, wrapped in residuals and LayerNorm.",
      "Original design: encoder + decoder. Generative LLMs: decoder-only.",
    ],
    Visual: Slide05Architecture,
  },
  {
    kicker: "The core idea",
    title: "Self-Attention",
    points: [
      "Each token builds a new vector from a weighted mix of the tokens it can see.",
      "The weights say how relevant each token is to this one.",
      "Context resolves meaning: with “approved … loan”, “bank” reads as financial.",
      "Causal mask: a decoder token never sees future tokens.",
    ],
    Visual: Slide06SelfAttention,
  },
  {
    kicker: "Under the hood",
    title: "Query, Key and Value",
    points: [
      "Q, K and V are three learned linear projections of each token's vector.",
      "Query · Key gives a relevance score for every token pair.",
      "Scale by √dₖ, mask, softmax: you get the attention weights.",
      "The output is the weighted sum of the Value vectors.",
    ],
    Visual: Slide07QKV,
  },
  {
    kicker: "Many perspectives",
    title: "Multi-Head Attention",
    points: [
      "Several attention heads run in parallel, each with its own Q/K/V weights.",
      "Different heads can specialise in different relationships.",
      "Head outputs are concatenated and projected back with W_O.",
    ],
    Visual: Slide08MultiHead,
  },
  {
    kicker: "Inside one block",
    title: "Feed-Forward & Residuals",
    points: [
      "After attention, a feed-forward network transforms each token on its own.",
      "Expand → nonlinearity → project back.",
      "Residual connections add each sub-layer's output to its input.",
      "LayerNorm keeps activations well scaled.",
    ],
    Visual: Slide09Block,
  },
  {
    kicker: "Depth",
    title: "Stacking Transformer Blocks",
    points: [
      "Blocks are stacked: each block's output is the next block's input.",
      "Each layer refines every token's vector a little more.",
      "Deeper layers hold more contextual, abstract representations.",
    ],
    Visual: Slide10Stacking,
  },
  {
    kicker: "Vectors → words",
    title: "Next-Token Prediction",
    points: [
      "The last position's final vector is projected to one logit per vocabulary token.",
      "Softmax turns logits into probabilities.",
      "Choose a token (greedy or sampling), append it, run again.",
      "Text is generated one token at a time (autoregressively).",
    ],
    Visual: Slide11Output,
  },
  {
    kicker: "Putting it all together",
    title: "The Complete Walkthrough",
    points: [
      "Text → tokens → embeddings + position",
      "→ N × (attention + feed-forward)",
      "→ output projection → softmax → next token",
      "Repeat until done.",
    ],
    Visual: Slide12Walkthrough,
  },
];
