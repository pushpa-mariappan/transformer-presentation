"""SQLite persistence for participants, quiz answers and presentation state."""

import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS participants (
    id         TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
    token      TEXT NOT NULL UNIQUE,
    joined_at  REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS answers (
    participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    question_id    TEXT NOT NULL,
    choice         INTEGER NOT NULL,
    correct        INTEGER NOT NULL,
    answered_at    REAL NOT NULL,
    PRIMARY KEY (participant_id, question_id)
);
CREATE TABLE IF NOT EXISTS presentation_state (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    phase        TEXT NOT NULL,
    slide        INTEGER NOT NULL,
    starts_at    REAL,
    replay_nonce INTEGER NOT NULL
);
"""


class UsernameTaken(Exception):
    pass


@dataclass
class Participant:
    id: str
    username: str
    token: str


@dataclass
class PresentationState:
    phase: str = "waiting"  # waiting | live | ended
    slide: int = 0
    starts_at: float | None = None  # epoch milliseconds
    replay_nonce: int = 0


class Database:
    def __init__(self, path: str | Path):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        with self._lock:
            self._conn.execute("PRAGMA foreign_keys = ON")
            self._conn.execute("PRAGMA journal_mode = WAL")
            self._conn.executescript(SCHEMA)
            self._conn.commit()

    # ---- participants -------------------------------------------------
    def create_participant(self, username: str) -> Participant:
        p = Participant(id=uuid.uuid4().hex, username=username, token=uuid.uuid4().hex + uuid.uuid4().hex)
        with self._lock:
            try:
                self._conn.execute(
                    "INSERT INTO participants (id, username, token, joined_at) VALUES (?, ?, ?, ?)",
                    (p.id, p.username, p.token, time.time()),
                )
                self._conn.commit()
            except sqlite3.IntegrityError as exc:
                raise UsernameTaken(username) from exc
        return p

    def participant_by_token(self, token: str) -> Participant | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT id, username, token FROM participants WHERE token = ?", (token,)
            ).fetchone()
        return Participant(**dict(row)) if row else None

    # ---- answers ------------------------------------------------------
    def record_answer(self, participant_id: str, question_id: str, choice: int, correct: bool) -> bool:
        """Store an answer. Returns False if this participant already answered the question."""
        with self._lock:
            cur = self._conn.execute(
                "INSERT OR IGNORE INTO answers (participant_id, question_id, choice, correct, answered_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (participant_id, question_id, choice, int(correct), time.time()),
            )
            self._conn.commit()
            return cur.rowcount == 1

    def answers_for(self, participant_id: str) -> list[sqlite3.Row]:
        with self._lock:
            return self._conn.execute(
                "SELECT question_id, choice, correct FROM answers WHERE participant_id = ?", (participant_id,)
            ).fetchall()

    def score_for(self, participant_id: str) -> int:
        with self._lock:
            row = self._conn.execute(
                "SELECT COALESCE(SUM(correct), 0) AS s FROM answers WHERE participant_id = ?", (participant_id,)
            ).fetchone()
        return int(row["s"])

    def scoreboard(self) -> list[dict]:
        """All participants with score, answer count, and the time of their last answer (tie-breaker)."""
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT p.id, p.username,
                       COALESCE(SUM(a.correct), 0) AS score,
                       COUNT(a.question_id)        AS answered,
                       MAX(a.answered_at)          AS last_answer
                FROM participants p
                LEFT JOIN answers a ON a.participant_id = p.id
                GROUP BY p.id
                """
            ).fetchall()
        return [dict(r) for r in rows]

    def answer_distribution(self, question_ids: list[str]) -> dict[str, list[int]]:
        dist = {qid: [0, 0, 0, 0] for qid in question_ids}
        if not question_ids:
            return dist
        marks = ",".join("?" for _ in question_ids)
        with self._lock:
            rows = self._conn.execute(
                f"SELECT question_id, choice, COUNT(*) AS n FROM answers "
                f"WHERE question_id IN ({marks}) GROUP BY question_id, choice",
                question_ids,
            ).fetchall()
        for r in rows:
            if 0 <= r["choice"] < 4:
                dist[r["question_id"]][r["choice"]] = r["n"]
        return dist

    # ---- presentation state --------------------------------------------
    def load_state(self) -> PresentationState:
        with self._lock:
            row = self._conn.execute(
                "SELECT phase, slide, starts_at, replay_nonce FROM presentation_state WHERE id = 1"
            ).fetchone()
        return PresentationState(**dict(row)) if row else PresentationState()

    def save_state(self, s: PresentationState) -> None:
        with self._lock:
            self._conn.execute(
                "INSERT INTO presentation_state (id, phase, slide, starts_at, replay_nonce) VALUES (1, ?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET phase=excluded.phase, slide=excluded.slide, "
                "starts_at=excluded.starts_at, replay_nonce=excluded.replay_nonce",
                (s.phase, s.slide, s.starts_at, s.replay_nonce),
            )
            self._conn.commit()

    def reset(self) -> None:
        with self._lock:
            self._conn.execute("DELETE FROM answers")
            self._conn.execute("DELETE FROM participants")
            self._conn.execute("DELETE FROM presentation_state")
            self._conn.commit()
