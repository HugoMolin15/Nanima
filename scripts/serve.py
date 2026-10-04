"""Local preview server for the Nanima site.

Behaves like Netlify for the parts this site relies on:
- clean URLs: /card-pages/card-1 serves card-pages/card-1.html
- unknown paths get 404.html
It also disables caching so edits show up on a normal reload.

Usage: python3 scripts/serve.py [port]
"""

import http.server
import os
import sys
from functools import partial

SITE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PORT = 8123


class PreviewHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and os.path.exists(path + ".html"):
            self.path = self.path.split("?", 1)[0].split("#", 1)[0] + ".html"
        elif not os.path.exists(path):
            self.send_not_found_page()
            return None
        return super().send_head()

    def send_not_found_page(self):
        not_found_page = os.path.join(SITE_ROOT, "404.html")
        if not os.path.exists(not_found_page):
            self.send_error(404)
            return
        with open(not_found_page, "rb") as page:
            body = page.read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    try:
        port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    except ValueError:
        sys.exit("Port must be a number, e.g. python3 scripts/serve.py 8123")

    handler = partial(PreviewHandler, directory=SITE_ROOT)
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    except OSError:
        sys.exit(f"Port {port} is busy. Try another: python3 scripts/serve.py {port + 1}")

    print(f"Previewing Nanima at http://localhost:{port}  (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
