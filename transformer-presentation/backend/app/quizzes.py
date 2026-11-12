"""Quiz questions and answer key.

The answer key lives only on the server. Clients receive the public view of a
question (prompt + options) and learn the correct answer and explanation only
after they submit.

Slide indexes are 0-based (slide 0 == "Slide 1: What Is a Transformer?").
"""

from dataclasses import dataclass

TOTAL_SLIDES = 12


@dataclass(frozen=True)
class Question:
    id: str
    slide: int
    prompt: str
    options: tuple[str, str, str, str]
    correct: int
    explanation: str

    def public(self) -> dict:
        return {"id": self.id, "slide": self.slide, "prompt": self.prompt, "options": list(self.options)}


QUESTIONS: list[Question] = [
    Question(
        id="s1-q1",
        slide=0,
        prompt="What is the main mechanism Transformers use to model relationships between tokens?",
        options=(
            "Recurrence: passing a hidden state from one token to the next",
            "Self-attention: every token weighs information from other tokens",
            "Convolution: sliding fixed-size filters over the text",
            "A lookup table of common word pairs",
        ),
        correct=1,
        explanation="Self-attention lets each token directly compute how much to draw from every other "
        "(allowed) token, in parallel, instead of passing information step by step like an RNN.",
    ),
    Question(
        id="s2-q1",
        slide=1,
        prompt="Why is tokenization necessary?",
        options=(
            "It compresses the text so it uses less disk space",
            "It removes grammar so the model only sees keywords",
            "The model works on a fixed vocabulary of discrete units, each mapped to an integer ID",
            "It translates every language into English first",
        ),
        correct=2,
        explanation="Neural networks compute on numbers. Tokenization splits text into units from a fixed "
        "vocabulary (words, sub-words, punctuation) and maps each to an integer ID the model can look up.",
    ),
    Question(
        id="s3-q1",
        slide=2,
        prompt="What is the purpose of a token embedding?",
        options=(
            "To map each token ID to a learned vector of numbers the network can compute with",
            "To encrypt the token so the model cannot read it",
            "To count how often the token appears in the training data",
            "To store the dictionary definition of the token",
        ),
        correct=0,
        explanation="The embedding matrix has one learned row per vocabulary entry. Looking up a token ID returns "
        "its vector, a dense numeric representation that training shapes so similar tokens end up nearby.",
    ),
    Question(
        id="s4-q1",
        slide=3,
        prompt="Why does a Transformer need positional information?",
        options=(
            "To make the model run faster on GPUs",
            "Attention by itself has no notion of order, so “bank approved loan” and “loan approved bank” would look alike",
            "To tell the model how many layers it has",
            "To remove duplicate tokens such as the two “the” tokens",
        ),
        correct=1,
        explanation="Attention compares tokens as a set: shuffle the inputs and you get the same outputs, shuffled. "
        "Positional encodings/embeddings (or rotary embeddings) inject order so word order can change meaning.",
    ),
    Question(
        id="s5-q1",
        slide=4,
        prompt="How does a decoder-only Transformer (like GPT-style LLMs) differ from the original encoder-decoder design?",
        options=(
            "It has no attention layers, only feed-forward layers",
            "It uses a separate encoder to read the prompt and a decoder to write the answer",
            "It uses one stack of blocks with masked (causal) self-attention to both read the prompt and generate",
            "It processes only one token per layer",
        ),
        correct=2,
        explanation="Decoder-only models drop the separate encoder and cross-attention. A single stack of blocks with "
        "causal self-attention reads the prompt and predicts the next token.",
    ),
    Question(
        id="s6-q1",
        slide=5,
        prompt="What does self-attention help a Transformer calculate?",
        options=(
            "The spelling of each token",
            "For each token, a context-aware representation built as a weighted mix of information from the tokens it can see",
            "The number of tokens in the sentence",
            "A fixed meaning for each word that never changes with context",
        ),
        correct=1,
        explanation="Each position takes a weighted sum of value vectors from the tokens it may attend to "
        "(itself and earlier tokens in a decoder), so its representation now reflects context.",
    ),
    Question(
        id="s7-q1",
        slide=6,
        prompt="What is the role of the Query and Key vectors in attention?",
        options=(
            "Their dot product scores how relevant each token is to the current token, which softmax turns into weights",
            "They store the final output of the layer",
            "They are the token IDs before embedding",
            "They decide how many attention heads to use",
        ),
        correct=0,
        explanation="The current token's query is compared with every allowed key via a dot product. Scaled and "
        "softmaxed, those scores become the attention weights used to mix the value vectors.",
    ),
    Question(
        id="s7-q2",
        slide=6,
        prompt="Why are the scores QKᵀ divided by √dₖ?",
        options=(
            "To convert the scores into token IDs",
            "To make the attention matrix square",
            "To keep dot products from growing with vector size, which would make softmax saturate and gradients vanish",
            "To apply the causal mask",
        ),
        correct=2,
        explanation="Dot products of dₖ-dimensional vectors grow roughly with √dₖ. Large scores push softmax toward "
        "one-hot outputs with tiny gradients, and scaling keeps training stable.",
    ),
    Question(
        id="s8-q1",
        slide=7,
        prompt="Why is multi-head attention useful?",
        options=(
            "Each head can focus on a different kind of relationship, in parallel, in its own subspace",
            "It lets the model skip the feed-forward network",
            "Each head processes a different sentence",
            "It guarantees every head learns exactly the same pattern for redundancy",
        ),
        correct=0,
        explanation="Heads have their own Q/K/V projections, so they can learn different patterns (e.g. previous-token, "
        "subject–object). Their outputs are concatenated and projected back to the model dimension.",
    ),
    Question(
        id="s9-q1",
        slide=8,
        prompt="What is the purpose of the feed-forward network in a Transformer block?",
        options=(
            "To move information between different token positions",
            "To apply a nonlinear transformation to each token's representation independently",
            "To choose the next token",
            "To split text into tokens",
        ),
        correct=1,
        explanation="Attention mixes information across positions; the FFN then processes each position on its own "
        "(expand → nonlinearity → project back), adding capacity to transform and store features.",
    ),
    Question(
        id="s10-q1",
        slide=9,
        prompt="Why are multiple Transformer blocks stacked?",
        options=(
            "So each block can handle a different word in the sentence",
            "Because a single block cannot store the vocabulary",
            "To refine representations step by step, building increasingly contextual and abstract features",
            "To make the output probabilities sum to one",
        ),
        correct=2,
        explanation="Every block reads the residual stream and adds an update. Many layers let the model compose "
        "simple patterns into richer, context-dependent representations.",
    ),
    Question(
        id="s11-q1",
        slide=10,
        prompt="How does a generative Transformer produce text?",
        options=(
            "It writes the whole answer in a single step",
            "It retrieves a matching sentence from its training data",
            "It predicts a probability distribution for the next token, picks one, appends it, and repeats",
            "It predicts the last word first and works backwards",
        ),
        correct=2,
        explanation="Generation is autoregressive: logits → softmax → choose a token (greedy or sampling) → append to "
        "the input → run again, until a stop token or length limit.",
    ),
    Question(
        id="s12-q1",
        slide=11,
        prompt="Which order matches the flow of data through a decoder-only LLM?",
        options=(
            "Softmax → Embeddings → Tokenization → Transformer blocks → Output projection",
            "Tokenization → Embeddings + position → Transformer blocks (attention + FFN) → Output projection → Softmax",
            "Transformer blocks → Tokenization → Softmax → Embeddings",
            "Tokenization → Softmax → Transformer blocks → Embeddings → Output projection",
        ),
        correct=1,
        explanation="Text → token IDs → vectors (+ position) → N blocks of attention + feed-forward → logits over the "
        "vocabulary → softmax probabilities for the next token.",
    ),
    Question(
        id="s12-q2",
        slide=11,
        prompt="In a decoder-only model reading “The bank approved the loan.”, which tokens can the position of “approved” attend to?",
        options=(
            "Only “loan”",
            "All six tokens, including the ones after it",
            "“The”, “bank”, and “approved” itself",
            "No tokens: attention only happens at the last position",
        ),
        correct=2,
        explanation="Causal masking lets each position see itself and earlier positions only. That is what makes "
        "next-token training and generation work.",
    ),
]

BY_ID: dict[str, Question] = {q.id: q for q in QUESTIONS}
TOTAL_QUESTIONS = len(QUESTIONS)


def questions_for_slide(slide: int) -> list[Question]:
    return [q for q in QUESTIONS if q.slide == slide]
