import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.quizzes import BY_ID, QUESTIONS, TOTAL_QUESTIONS, TOTAL_SLIDES, questions_for_slide

KEY = "test-key"


@pytest.fixture
def client(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), presenter_key=KEY)
    with TestClient(app) as c:
        yield c


def drain_until(ws, msg_type, max_messages=50):
    for _ in range(max_messages):
        msg = ws.receive_json()
        if msg["type"] == msg_type:
            return msg
    raise AssertionError(f"no {msg_type} message received")


def join(client, name):
    r = client.post("/api/join", json={"username": name})
    assert r.status_code == 200, r.text
    return r.json()


# ---- quiz content sanity ------------------------------------------------------
def test_every_slide_has_one_or_two_questions():
    for slide in range(TOTAL_SLIDES):
        assert 1 <= len(questions_for_slide(slide)) <= 2, slide
    assert TOTAL_QUESTIONS == 14
    assert len(BY_ID) == len(QUESTIONS)
    for q in QUESTIONS:
        assert len(q.options) == 4 and 0 <= q.correct < 4


# ---- REST ------------------------------------------------------------------
def test_join_and_duplicate_username(client):
    p = join(client, "  Priya  ")
    assert p["username"] == "Priya"
    assert client.post("/api/join", json={"username": "priya"}).status_code == 409
    assert client.post("/api/join", json={"username": "   "}).status_code == 422


def test_presenter_login(client):
    assert client.post("/api/presenter/login", json={"key": KEY}).status_code == 200
    assert client.post("/api/presenter/login", json={"key": "nope"}).status_code == 401


# ---- WebSocket flow ------------------------------------------------------------
def test_invalid_token_rejected(client):
    with client.websocket_connect("/ws?role=participant&token=bogus") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "error" and msg["code"] == "invalid_token"


def test_presenter_controls_sync_and_scoring(client):
    p = join(client, "Priya")
    with client.websocket_connect(f"/ws?role=presenter&key={KEY}") as presenter, client.websocket_connect(
        f"/ws?role=participant&token={p['token']}"
    ) as part:
        state = drain_until(part, "state")
        assert state["phase"] == "waiting" and state["questions"] == []

        # participants cannot navigate
        part.send_json({"type": "next"})
        part.send_json({"type": "start"})

        presenter.send_json({"type": "start"})
        state = drain_until(part, "state")
        assert state["phase"] == "live" and state["slide"] == 0
        q = state["questions"][0]
        assert "correct" not in q and "explanation" not in q  # answer key never leaks

        # correct answer scores once
        part.send_json({"type": "answer", "questionId": q["id"], "choice": BY_ID[q["id"]].correct})
        res = drain_until(part, "answer_result")
        assert res["correct"] is True and res["duplicate"] is False
        me = drain_until(part, "me")
        assert me["score"] == 1

        # resubmitting (even a different choice) does not change score
        part.send_json({"type": "answer", "questionId": q["id"], "choice": (BY_ID[q["id"]].correct + 1) % 4})
        res = drain_until(part, "answer_result")
        assert res["duplicate"] is True and res["correct"] is True
        assert drain_until(part, "me")["score"] == 1

        # presenter sees the submission count
        stats = drain_until(presenter, "stats")
        while stats["answered"].get(q["id"]) != 1:
            stats = drain_until(presenter, "stats")

        # questions for other slides are rejected
        future = questions_for_slide(5)[0]
        part.send_json({"type": "answer", "questionId": future.id, "choice": future.correct})
        assert drain_until(part, "error")["message"]

        presenter.send_json({"type": "next"})
        state = drain_until(part, "state")
        assert state["slide"] == 1

        presenter.send_json({"type": "end"})
        state = drain_until(part, "state")
        assert state["phase"] == "ended"
        board = drain_until(part, "leaderboard")
        assert board["entries"][0]["username"] == "Priya" and board["entries"][0]["score"] == 1


def test_reconnect_returns_to_current_slide_with_answers(client):
    p = join(client, "Sam")
    with client.websocket_connect(f"/ws?role=presenter&key={KEY}") as presenter:
        presenter.send_json({"type": "start"})
        presenter.send_json({"type": "next"})
        presenter.send_json({"type": "next"})
        drain_until(presenter, "state")

        with client.websocket_connect(f"/ws?role=participant&token={p['token']}") as part:
            state = drain_until(part, "state")
            while state["slide"] != 2:
                state = drain_until(part, "state")
            q = state["questions"][0]
            part.send_json({"type": "answer", "questionId": q["id"], "choice": 3})
            drain_until(part, "answer_result")

        with client.websocket_connect(f"/ws?role=participant&token={p['token']}") as part:
            state = drain_until(part, "state")
            assert state["phase"] == "live" and state["slide"] == 2
            me = drain_until(part, "me")
            assert me["answers"][q["id"]]["choice"] == 3


def test_reset_invalidates_participants(client):
    p = join(client, "Alex")
    with client.websocket_connect(f"/ws?role=presenter&key={KEY}") as presenter:
        with client.websocket_connect(f"/ws?role=participant&token={p['token']}") as part:
            drain_until(part, "state")
            presenter.send_json({"type": "reset"})
            assert drain_until(part, "reset")["type"] == "reset"
    assert client.post("/api/join", json={"username": "Alex"}).status_code == 200
