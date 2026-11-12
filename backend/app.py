# Máy chủ Python cục bộ phục vụ giao diện HTML và API cho ba nhóm giải thuật.

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
import webbrowser

BASE_DIR = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent.parent))
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from algorithms import aes, des, playfair, rsa  # noqa: E402

FRONTEND_DIR = BASE_DIR / "frontend"

DISPATCH = {
    "playfair": playfair.run,
    "rsa": rsa.run,
    "des": des.run,
    "aes": aes.run,
}


class AppRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/run":
            self._send_json(404, {"status": "error", "message": "Endpoint không tồn tại."})
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            raw_body = self.rfile.read(length).decode("utf-8")
            req = json.loads(raw_body)
            algo = req.get("algorithm", "")
            mode = req.get("mode", "encrypt")
            payload = req.get("payload", {})

            handler = DISPATCH.get(algo)
            if handler is None:
                self._send_json(400, {"status": "error", "message": f"Thuật toán không hợp lệ: {algo}"})
                return

            output = handler(mode, payload)
            self._send_json(
                200,
                {
                    "status": "ok",
                    "algorithm": algo,
                    "mode": mode,
                    "result": output.get("result", ""),
                    "metadata": output.get("metadata", {}),
                    "steps": output.get("steps", []),
                },
            )
        except NotImplementedError:
            self._send_json(200, {"status": "not_implemented"})
        except ValueError as exc:
            self._send_json(400, {"status": "error", "message": str(exc)})
        except Exception as exc:
            self._send_json(500, {"status": "error", "message": f"Lỗi xử lý Python: {exc}"})


def find_server(host: str = "127.0.0.1", start_port: int = 8000) -> ThreadingHTTPServer:
    handler = partial(AppRequestHandler, directory=str(FRONTEND_DIR))
    for port in range(start_port, start_port + 20):
        try:
            return ThreadingHTTPServer((host, port), handler)
        except OSError:
            continue
    return ThreadingHTTPServer((host, 0), handler)


def main():
    server = find_server()
    host, port = server.server_address
    url = f"http://{host}:{port}/index.html"
    print(f"Ung dung NT101 dang chay tai: {url}")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
