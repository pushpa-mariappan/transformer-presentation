# Inside the Transformer: How LLMs Understand and Generate Language

A live, presenter-controlled, interactive presentation that explains how the Transformer architecture works inside
LLMs. Every participant joins from their own device and sees the same slide at the same moment. They can explore
animated diagrams and answer quizzes, and the event ends with a celebration screen and a live leaderboard.

Every slide follows one running example: **“The bank approved the loan.”**

---

## 1. Experience design

| Route        | Who                       | What it does |
|--------------|---------------------------|--------------|
| `/`          | Participants              | Username login → waiting room with countdown → synchronized slides with quizzes → celebration + leaderboard |
| `/presenter` | Presenter (key protected) | Start / Next / Previous / Replay / End, countdown, live quiz results, connected count, slide preview, scores |
| `/screen`    | Projector                 | Read-only view that follows the presenter and shows answer counts instead of quiz buttons |

**Slide flow** (decoder-only Transformer as the primary example from slide 5 on):

| # | Slide | Interactive visualization | Quiz |
|---|-------|---------------------------|------|
| 1 | What Is a Transformer? | Animated block diagram with data flowing up; RNN (sequential) vs Transformer (parallel) | 1 |
| 2 | Tokenization | Sentence splits into tokens → token IDs (labelled illustrative); sub-word examples | 1 |
| 3 | Token Embeddings | Click a token → its row is looked up in the embedding matrix; 2-D embedding-space sketch showing “bank” between the money and river senses | 1 |
| 4 | Positional Information | “bank approved loan” vs “loan approved bank” with and without position; embedding + PE = input; sinusoidal / learned / RoPE tabs | 1 |
| 5 | Architecture Overview | Full clickable decoder-only diagram (pre-LN, residuals, LM head) plus the original encoder-decoder view | 1 |
| 6 | Self-Attention | Click any token to see its attention arcs; causal vs bidirectional toggle; masked heat-map; “bank” sense meter | 1 |
| 7 | Query, Key, Value | 7 clickable steps of `softmax(QKᵀ/√dₖ)V` on real 4×4 numbers, computed live | 2 |
| 8 | Multi-Head Attention | Four heads with different patterns running in parallel → concat → W_O | 1 |
| 9 | FFN & Residuals | A vector travels through LN → Attention → ⊕ → LN → FFN → ⊕; FFN expansion and GELU curve | 1 |
| 10 | Stacking Blocks | All 6 tokens refined layer by layer; depth slider; how “bank” reads at the “loan” position by depth | 1 |
| 11 | Next-Token Prediction | Logits → softmax with a temperature slider; greedy vs sampling; generate token by token | 1 |
| 12 | Complete Walkthrough | Auto-playing 9-stage pipeline from the input text to the predicted “loan” (the presenter can replay it) | 2 |

That is **14 questions** in total. Correctness notes built into the content:
- Tokens and IDs are explicitly labelled *illustrative*.
- Causal masking is shown wherever attention appears. In decoder mode, “bank” cannot see “loan”: the financial
  sense is resolved at *later* positions that attend back to “bank”.
- Hand-picked attention weights, head roles and logits are labelled illustrative. The Q/K/V slide's numbers are
  computed exactly from the matrices shown.

## 2. Architecture

```
┌──────────────── Browser (React + TS + Tailwind + Framer Motion + SVG) ────────────────┐
│  /  participant       /presenter  dashboard          /screen  projector               │
│        └──────────────────── useLiveSession() WebSocket hook ──────────────┘          │
└───────────────────────────────────────┬───────────────────────────────────────────────┘
                                        │  ws://host/ws?role=…   +  POST /api/join
┌───────────────────────────────────────┴───────────────────────────────────────────────┐
│ FastAPI (single process)                                                              │
│  • Hub: the authoritative slide state (phase, slide, countdown, replay nonce)         │
│  • Only the presenter role can navigate; participant navigation messages are ignored  │
│  • Answer key stays on the server; answers are only accepted for the current slide    │
│  • SQLite: participants, answers (PK participant+question → no duplicate scoring),    │
│    presentation state (survives a server restart)                                     │
│  • Serves frontend/dist so the whole app is one URL                                   │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Server → client messages: `state`, `presence`, `me`, `answer_result`, `stats`, `leaderboard`, `reset`, `error`.
Client → server: participants send `answer`; the presenter sends `start | next | prev | goto | replay | end | resume | countdown | reset`.

**Reconnection:** the participant token is stored in `localStorage`. The socket reconnects with exponential backoff,
and the server immediately sends the current slide and the participant's previous answers and score.

```
transformer-presentation/
├── backend/   app/{main.py, hub.py, db.py, quizzes.py}, tests/
├── frontend/  src/{pages, components, slides, lib}
└── Dockerfile
```

## 3. Local setup

Requirements: **Node.js 20+** and **Python 3.11+** with [uv](https://docs.astral.sh/uv/).

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend (second terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173 (also exposed on your LAN IP)
```

Open:
- Participants: `http://<your-ip>:5173/`
- Presenter: `http://localhost:5173/presenter` (key: `transformer` unless you set `PRESENTER_KEY`)
- Projector: `http://localhost:5173/screen`

Run the backend tests with `cd backend && uv run pytest`.

> **Windows + Smart App Control:** if `import asyncio` fails with *“An Application Control policy has blocked this
> file”*, Windows is blocking the unsigned DLLs in uv's downloaded Python. Install the signed python.org build
> (`winget install Python.Python.3.13`) and point uv at it, for example
> `uv venv --python "%LOCALAPPDATA%\Programs\Python\Python313\python.exe"` followed by `uv sync`.

## 4. Running a presentation

1. Start the server, then open `/presenter` and `/screen` (put the screen view on the projector).
2. Optionally set a countdown (e.g. 5 min). Every waiting room shows the same synced timer.
3. Participants open the URL, enter a name, and land in the waiting room.
4. Click **Start Presentation**. Everyone jumps to slide 1 together.
5. Use **Next / Previous** (or a clicker: → / PageDown / Space, ← / PageUp). **R** replays the slide's animation on every screen.
6. Watch submissions and the answer distribution live. You can move on at any time.
7. Click **End Presentation**. Everyone sees confetti, their own score and badge, and the leaderboard.
8. Use **Reset session** to clear all participants and scores before the next run.

## 5. Deployment (single shared URL)

```bash
cd frontend && npm install && npm run build          # creates frontend/dist
cd ../backend
PRESENTER_KEY=your-secret uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

FastAPI now serves the built UI, the API and the WebSocket at `http://<host>:8000`.

### Render (recommended hosted option)

The repo root contains a `render.yaml` Blueprint that builds `transformer-presentation/Dockerfile` as one web service.

1. Push to GitHub, then in Render choose **New → Blueprint** and select the repository.
2. Enter a value for `PRESENTER_KEY` when prompted, then click **Apply**. The first build takes about 3–5 minutes.
3. Open `https://<service-name>.onrender.com/presenter`. Participants join at the root URL.

Render free-plan caveats:
- The service **sleeps after ~15 minutes without traffic**, and the next visit takes ~1 minute to wake it. Open the site
  a few minutes before your session to wake it up.
- The filesystem is **ephemeral**, so participants and scores are lost on every redeploy or restart. That's fine for a
  single live session. To keep data, use a paid plan, attach a persistent disk at `/data`, and leave `DB_PATH=/data/presentation.db`.

Or with Docker:

```bash
docker build -t transformer-presentation .
docker run -p 8000:8000 -e PRESENTER_KEY=your-secret -v tp-data:/data transformer-presentation
```

Notes:
- **Run exactly one worker/instance.** Live state and sockets are held in process memory.
- Behind a reverse proxy (nginx, Caddy, a PaaS), enable WebSocket upgrades on `/ws`. Use HTTPS so the app uses `wss://` automatically.
- Any host that runs a long-lived container works (Fly.io, Render, Railway, a VM). Serverless platforms without persistent WebSockets do not.

| Env var         | Default                       | Purpose |
|-----------------|-------------------------------|---------|
| `PRESENTER_KEY` | `transformer`                 | Presenter dashboard key. **Change it for any shared deployment.** |
| `DB_PATH`       | `backend/data/presentation.db`| SQLite file |
| `FRONTEND_DIST` | `frontend/dist`               | Built UI served by FastAPI |

## 6. Customising

- Quiz questions and the answer key live in `backend/app/quizzes.py`.
- Slide titles and key points live in `frontend/src/slides/index.ts`. Each slide's visualization is its own file in `frontend/src/slides/`.
- The running example (tokens, illustrative IDs, embeddings) lives in `frontend/src/lib/sentence.ts`.
