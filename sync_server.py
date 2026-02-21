#!/usr/bin/env python3
"""Lightweight sync backend for Portail Vie Scolaire.

Runs a small HTTP API with CORS enabled:
  GET  /api/ping   -> health + revision
  GET  /api/state  -> full shared state
  POST /api/state  -> upsert full shared state
"""

from __future__ import annotations

import json
import os
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


ROOT = os.path.dirname(os.path.abspath(__file__))
STORE_PATH = os.environ.get("PVS_SYNC_STORE", os.path.join(ROOT, "pvs_sync_store.json"))
LOCK = threading.Lock()


def _default_store() -> dict:
    return {"rev": 0, "updated_at": iso_now(), "state": {}, "history": []}


def _normalize_store(raw: object) -> dict:
    if not isinstance(raw, dict):
        return _default_store()
    rev = int(raw.get("rev", 0) or 0)
    updated_at = str(raw.get("updated_at", "")) or iso_now()
    state = raw.get("state", {})
    if not isinstance(state, dict):
        state = {}
    history = raw.get("history", [])
    if not isinstance(history, list):
        history = []
    return {"rev": rev, "updated_at": updated_at, "state": state, "history": history[:200]}


def _read_store() -> dict:
    if not os.path.exists(STORE_PATH):
        return _default_store()
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as fh:
            return _normalize_store(json.load(fh))
    except Exception:
        return _default_store()


def _write_store(store: dict) -> None:
    tmp = f"{STORE_PATH}.tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(store, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, STORE_PATH)


STORE = _read_store()


class Handler(BaseHTTPRequestHandler):
    server_version = "PVS-Sync/1.0"

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict | None:
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return None
        if size <= 0 or size > 25_000_000:
            return None
        try:
            raw = self.rfile.read(size)
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else None
        except Exception:
            return None

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_json(200, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/ping":
            with LOCK:
                self._send_json(
                    200,
                    {"ok": True, "rev": STORE.get("rev", 0), "updated_at": STORE.get("updated_at", "")},
                )
            return
        if path == "/api/state":
            with LOCK:
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "rev": STORE.get("rev", 0),
                        "updated_at": STORE.get("updated_at", ""),
                        "state": STORE.get("state", {}),
                    },
                )
            return
        if path == "/api/history":
            with LOCK:
                self._send_json(200, {"ok": True, "history": STORE.get("history", [])})
            return
        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path != "/api/state":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return
        data = self._read_json()
        if not data or not isinstance(data.get("state"), dict):
            self._send_json(400, {"ok": False, "error": "Invalid payload: expected object with 'state'"})
            return

        client = str(data.get("client", "ANON"))[:120]
        source = str(data.get("source", ""))[:120]
        now = iso_now()

        with LOCK:
            STORE["state"] = data["state"]
            STORE["rev"] = int(STORE.get("rev", 0)) + 1
            STORE["updated_at"] = now
            hist = STORE.setdefault("history", [])
            if not isinstance(hist, list):
                hist = []
            hist.insert(0, {"rev": STORE["rev"], "at": now, "client": client, "source": source})
            if len(hist) > 200:
                del hist[200:]
            STORE["history"] = hist
            _write_store(STORE)
            self._send_json(
                200,
                {"ok": True, "rev": STORE["rev"], "updated_at": STORE["updated_at"]},
            )

    def log_message(self, fmt: str, *args: object) -> None:
        # Keep console noise low while preserving essential traces.
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))


def main() -> None:
    port = 8765
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    env_port = os.environ.get("PVS_SYNC_PORT")
    if env_port:
        try:
            port = int(env_port)
        except ValueError:
            pass

    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"[PVS-Sync] Listening on http://127.0.0.1:{port}")
    print(f"[PVS-Sync] Store file: {STORE_PATH}")
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("\n[PVS-Sync] Stopped.")


if __name__ == "__main__":
    main()

