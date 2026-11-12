"""Real-time presentation hub.

The server is the single source of truth for which slide is showing. Clients
never navigate on their own: they render whatever state the hub broadcasts.

Roles
-----
participant : authenticated by the token returned from POST /api/join
presenter   : authenticated by PRESENTER_KEY; the only role allowed to navigate
screen      : read-only projector view (no quiz answering, no scores of others)

Server -> client messages
-------------------------
state       full presentation state (sent on connect and on every navigation)
presence    connected participant count + names
me          the participant's own score and answers (participants only)
answer_result  feedback for a just-submitted answer
stats       answer counts (screen) / distribution + roster (presenter)
leaderboard ranked scores (everyone, once the presentation has ended; presenter always)
reset       the session was wiped; participants must re-join
error       something was rejected
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field

from fastapi import WebSocket

from .db import Database, Participant, PresentationState
from .quizzes import BY_ID, TOTAL_QUESTIONS, TOTAL_SLIDES, questions_for_slide

log = logging.getLogger(__name__)

MAX_NAMES = 100


@dataclass(eq=False)
class Client:
    ws: WebSocket
    role: str
    participant: Participant | None = None
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


def badge_for(score: int, total: int) -> str:
    pct = score / total if total else 0
    if pct == 1:
        return "Transformer Architect"
    if pct >= 0.85:
        return "Transformer Expert"
    if pct >= 0.7:
        return "Attention Master"
    if pct >= 0.5:
        return "Rising Token"
    return "Curious Learner"


class Hub:
    def __init__(self, db: Database):
        self.db = db
        self.state: PresentationState = db.load_state()
        self.clients: set[Client] = set()

    # ---- helpers --------------------------------------------------------
    def _connected_participants(self) -> dict[str, str]:
        return {c.participant.id: c.participant.username for c in self.clients if c.participant}

    def _presence(self) -> dict:
        people = self._connected_participants()
        names = sorted(people.values(), key=str.lower)
        return {"type": "presence", "participantCount": len(people), "names": names[:MAX_NAMES]}

    def _base_state(self) -> dict:
        s = self.state
        return {
            "type": "state",
            "serverTime": time.time() * 1000,
            "phase": s.phase,
            "slide": s.slide,
            "totalSlides": TOTAL_SLIDES,
            "startsAt": s.starts_at,
            "replayNonce": s.replay_nonce,
            "totalQuestions": TOTAL_QUESTIONS,
            "questions": [q.public() for q in questions_for_slide(s.slide)] if s.phase == "live" else [],
        }

    def _me(self, p: Participant) -> dict:
        answers = {}
        score = 0
        for row in self.db.answers_for(p.id):
            q = BY_ID.get(row["question_id"])
            if not q:
                continue
            score += row["correct"]
            answers[q.id] = {
                "choice": row["choice"],
                "correct": bool(row["correct"]),
                "correctChoice": q.correct,
                "explanation": q.explanation,
            }
        return {
            "type": "me",
            "id": p.id,
            "username": p.username,
            "score": score,
            "totalQuestions": TOTAL_QUESTIONS,
            "answers": answers,
        }

    def leaderboard(self) -> dict:
        board = self.db.scoreboard()
        connected = self._connected_participants()
        board.sort(key=lambda r: (-r["score"], r["username"].lower()))
        entries, rank, prev = [], 0, None
        for i, r in enumerate(board):
            if r["score"] != prev:
                rank, prev = i + 1, r["score"]
            entries.append(
                {
                    "id": r["id"],
                    "username": r["username"],
                    "score": r["score"],
                    "answered": r["answered"],
                    "rank": rank,
                    "badge": badge_for(r["score"], TOTAL_QUESTIONS),
                    "online": r["id"] in connected,
                }
            )
        return {"type": "leaderboard", "totalQuestions": TOTAL_QUESTIONS, "entries": entries}

    def _stats(self, detailed: bool) -> dict:
        qids = [q.id for q in questions_for_slide(self.state.slide)] if self.state.phase == "live" else []
        dist = self.db.answer_distribution(qids)
        msg = {
            "type": "stats",
            "slide": self.state.slide,
            "answered": {qid: sum(d) for qid, d in dist.items()},
            "participantCount": len(self._connected_participants()),
        }
        if detailed:
            msg["distribution"] = dist
            msg["correct"] = {qid: BY_ID[qid].correct for qid in qids}
        return msg

    async def _send(self, client: Client, msg: dict) -> None:
        try:
            async with client.lock:
                await client.ws.send_json(msg)
        except Exception:  # noqa: BLE001 - a dead socket must not break broadcasts
            log.debug("send failed; dropping client")
            self.clients.discard(client)

    async def _send_all(self, msgs_for) -> None:
        """msgs_for(client) -> list of messages to send to that client."""
        await asyncio.gather(*(self._send_many(c, msgs_for(c)) for c in list(self.clients)))

    async def _send_many(self, client: Client, msgs: list[dict]) -> None:
        for m in msgs:
            await self._send(client, m)

    # ---- full sync -------------------------------------------------------
    def _snapshot_for(self, c: Client, base: dict, presence: dict, board: dict | None) -> list[dict]:
        msgs = [base, presence]
        if c.role == "participant" and c.participant:
            msgs.append(self._me(c.participant))
        if c.role == "presenter":
            msgs.append(self._stats(detailed=True))
        if c.role == "screen":
            msgs.append(self._stats(detailed=False))
        if board and (c.role == "presenter" or self.state.phase == "ended"):
            msgs.append(board)
        return msgs

    async def broadcast_snapshot(self) -> None:
        base, presence, board = self._base_state(), self._presence(), self.leaderboard()
        await self._send_all(lambda c: self._snapshot_for(c, base, presence, board))

    async def broadcast_presence(self) -> None:
        presence = self._presence()
        board = self.leaderboard()
        detailed, simple = self._stats(True), self._stats(False)

        def msgs(c: Client) -> list[dict]:
            out = [presence]
            if c.role == "presenter":
                out += [detailed, board]
            elif c.role == "screen":
                out.append(simple)
            if self.state.phase == "ended" and c.role != "presenter":
                out.append(board)
            return out

        await self._send_all(msgs)

    # ---- connection lifecycle -------------------------------------------
    async def connect(self, client: Client) -> None:
        self.clients.add(client)
        board = self.leaderboard()
        await self._send_many(client, self._snapshot_for(client, self._base_state(), self._presence(), board))
        await self.broadcast_presence()

    async def disconnect(self, client: Client) -> None:
        self.clients.discard(client)
        await self.broadcast_presence()

    # ---- presenter commands ------------------------------------------------
    async def handle_presenter(self, msg: dict) -> None:
        s = self.state
        action = msg.get("type")
        if action == "start":
            s.phase, s.slide = "live", 0
        elif action == "next":
            if s.phase == "live" and s.slide < TOTAL_SLIDES - 1:
                s.slide += 1
        elif action == "prev":
            if s.phase == "live" and s.slide > 0:
                s.slide -= 1
        elif action == "goto":
            target = msg.get("slide")
            if s.phase == "live" and isinstance(target, int) and 0 <= target < TOTAL_SLIDES:
                s.slide = target
        elif action == "replay":
            s.replay_nonce += 1
        elif action == "end":
            s.phase = "ended"
        elif action == "resume":
            if s.phase == "ended":
                s.phase = "live"
        elif action == "countdown":
            minutes = msg.get("minutes")
            if isinstance(minutes, (int, float)) and 0 < minutes <= 180:
                s.starts_at = time.time() * 1000 + minutes * 60_000
            else:
                s.starts_at = None
            if s.phase != "live":
                s.phase = "waiting"
        elif action == "reset":
            await self.reset()
            return
        else:
            return
        self.db.save_state(s)
        await self.broadcast_snapshot()

    async def reset(self) -> None:
        self.db.reset()
        self.state = PresentationState()
        self.db.save_state(self.state)
        for c in list(self.clients):
            if c.role == "participant":
                await self._send(c, {"type": "reset"})
                c.participant = None
                try:
                    await c.ws.close(code=4000)
                except Exception:  # noqa: BLE001
                    pass
                self.clients.discard(c)
        await self.broadcast_snapshot()

    # ---- participant actions ------------------------------------------------
    async def handle_answer(self, client: Client, msg: dict) -> None:
        p = client.participant
        assert p is not None
        qid, choice = msg.get("questionId"), msg.get("choice")
        q = BY_ID.get(qid) if isinstance(qid, str) else None
        if q is None or not isinstance(choice, int) or not 0 <= choice < 4:
            await self._send(client, {"type": "error", "message": "Invalid answer."})
            return
        if self.state.phase != "live" or q.slide != self.state.slide:
            await self._send(client, {"type": "error", "message": "This question is not open right now."})
            return

        correct = choice == q.correct
        inserted = self.db.record_answer(p.id, q.id, choice, correct)
        me = self._me(p)
        prior = me["answers"][q.id]  # authoritative stored answer (first submission wins)
        await self._send(
            client,
            {
                "type": "answer_result",
                "questionId": q.id,
                "duplicate": not inserted,
                **prior,
            },
        )
        detailed, simple, board = self._stats(True), self._stats(False), self.leaderboard()
        for c in list(self.clients):
            if c.participant and c.participant.id == p.id:
                await self._send(c, me)  # keeps every open tab of this participant in sync
            elif c.role == "presenter":
                await self._send_many(c, [detailed, board])
            elif c.role == "screen":
                await self._send(c, simple)
