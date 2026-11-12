"""FastAPI application: REST endpoints, the WebSocket hub, and the built frontend."""

import json
import logging
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from .db import Database, UsernameTaken
from .hub import Client, Hub
from .quizzes import TOTAL_QUESTIONS, TOTAL_SLIDES

BASE_DIR = Path(__file__).resolve().parent.parent
PRESENTER_KEY = os.environ.get("PRESENTER_KEY", "transformer")
DB_PATH = os.environ.get("DB_PATH", str(BASE_DIR / "data" / "presentation.db"))
FRONTEND_DIST = Path(os.environ.get("FRONTEND_DIST", BASE_DIR.parent / "frontend" / "dist"))

logging.basicConfig(level=logging.INFO)


def create_app(db_path: str = DB_PATH, presenter_key: str = PRESENTER_KEY) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.hub = Hub(Database(db_path))
        yield

    app = FastAPI(title="Inside the Transformer – live presentation", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

    def hub() -> Hub:
        return app.state.hub

    # ---- REST ------------------------------------------------------------
    class JoinRequest(BaseModel):
        username: str = Field(min_length=1, max_length=24)

        @field_validator("username")
        @classmethod
        def clean(cls, v: str) -> str:
            v = " ".join(v.split())
            if not v:
                raise ValueError("Username cannot be blank")
            return v

    class PresenterLogin(BaseModel):
        key: str

    @app.get("/api/health")
    def health():
        return {"status": "ok", "slides": TOTAL_SLIDES, "questions": TOTAL_QUESTIONS}

    @app.post("/api/join")
    def join(req: JoinRequest):
        try:
            p = hub().db.create_participant(req.username)
        except UsernameTaken:
            raise HTTPException(409, "That name is already in the room. Try adding an initial.")
        return {"id": p.id, "username": p.username, "token": p.token}

    @app.post("/api/presenter/login")
    def presenter_login(req: PresenterLogin):
        if not secrets.compare_digest(req.key, presenter_key):
            raise HTTPException(401, "Invalid presenter key")
        return {"ok": True}

    # ---- WebSocket ---------------------------------------------------------
    @app.websocket("/ws")
    async def ws_endpoint(ws: WebSocket, role: str = "participant", token: str = "", key: str = ""):
        h = hub()
        await ws.accept()
        client = Client(ws=ws, role=role)
        if role == "participant":
            client.participant = h.db.participant_by_token(token)
            if client.participant is None:
                await ws.send_json({"type": "error", "code": "invalid_token", "message": "Session expired."})
                await ws.close(code=4401)
                return
        elif role == "presenter":
            if not secrets.compare_digest(key, presenter_key):
                await ws.send_json({"type": "error", "code": "unauthorized", "message": "Invalid presenter key."})
                await ws.close(code=4401)
                return
        elif role != "screen":
            await ws.close(code=4400)
            return

        await h.connect(client)
        try:
            while True:
                try:
                    msg = json.loads(await ws.receive_text())
                except ValueError:
                    continue  # ignore malformed frames
                if not isinstance(msg, dict):
                    continue
                kind = msg.get("type")
                if kind == "ping":
                    await h._send(client, {"type": "pong"})
                elif client.role == "presenter":
                    await h.handle_presenter(msg)
                elif client.role == "participant" and kind == "answer" and client.participant:
                    await h.handle_answer(client, msg)
                # anything else (e.g. a participant trying to navigate) is ignored
        except (WebSocketDisconnect, RuntimeError):
            pass
        finally:
            await h.disconnect(client)

    # ---- Built frontend (single-URL deployment) ---------------------------
    if FRONTEND_DIST.is_dir():
        assets = FRONTEND_DIST / "assets"
        if assets.is_dir():
            app.mount("/assets", StaticFiles(directory=assets), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        def spa(path: str):
            candidate = (FRONTEND_DIST / path).resolve()
            if path and candidate.is_file() and FRONTEND_DIST.resolve() in candidate.parents:
                return FileResponse(candidate)
            return FileResponse(FRONTEND_DIST / "index.html")

    return app


app = create_app()
