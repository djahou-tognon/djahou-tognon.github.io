#!/usr/bin/env python3
"""Local preview. Writing the site is accepted only from this machine."""

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8090
MAX_BODY = 2_000_000
FILES = {
    "display": os.path.join(ROOT, "content", "display.json"),
    "local": os.path.join(ROOT, "content", "local.json"),
    "css": os.path.join(ROOT, "css", "custom.css"),
}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__folio/status":
            body = b'{"local":true}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/__folio/save":
            self.send_error(404)
            return
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            self._json(403, {"error": "local only"})
            return
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0 or length > MAX_BODY:
            self._json(413, {"error": "invalid size"})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeError, json.JSONDecodeError):
            self._json(400, {"error": "invalid json"})
            return
        display = payload.get("display")
        local = payload.get("local")
        css = payload.get("css")
        if not isinstance(display, dict) or not isinstance(local, dict) or not isinstance(css, str):
            self._json(400, {"error": "invalid payload"})
            return
        if len(css) > 100_000:
            self._json(413, {"error": "css too large"})
            return
        self._write(FILES["display"], json.dumps(display, ensure_ascii=False, indent=2) + "\n")
        self._write(FILES["local"], json.dumps(local, ensure_ascii=False, indent=2) + "\n")
        self._write(FILES["css"], css if css.endswith("\n") else css + "\n")
        self._json(200, {"ok": True})

    def _write(self, path, text):
        temporary = path + ".tmp"
        with open(temporary, "w", encoding="utf-8") as handle:
            handle.write(text)
        os.replace(temporary, path)

    def _json(self, code, data):
        raw = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


if __name__ == "__main__":
    os.chdir(ROOT)
    print(f"http://127.0.0.1:{PORT}")
    print(f"Affichage : http://127.0.0.1:{PORT}/studio.html")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
