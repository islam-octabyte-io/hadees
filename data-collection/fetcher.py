"""
fetcher.py — A small, polite HTTP client for al-hadees.com.

Features:
  * A reused requests.Session with a browser-like User-Agent.
  * Automatic retries with exponential backoff on transient failures.
  * A configurable delay between requests so we do not hammer the site.
"""

import time
import requests

BASE_URL = "https://al-hadees.com"

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0 Safari/537.36"
    ),
    "Accept-Language": "en,ur;q=0.9,ar;q=0.8",
}


class Fetcher:
    def __init__(self, delay=0.5, timeout=30, max_retries=4, backoff=2.0):
        self.delay = delay            # seconds to sleep after every request
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff = backoff
        self.session = requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)

    def get(self, url):
        """
        GET a URL and return the decoded HTML text.

        Retries on connection errors and 5xx responses. Raises the last
        exception if every attempt fails.
        """
        last_exc = None
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, timeout=self.timeout)
                if resp.status_code >= 500:
                    raise requests.HTTPError(f"{resp.status_code} for {url}")
                resp.encoding = resp.encoding or "utf-8"
                if self.delay:
                    time.sleep(self.delay)
                return resp.text
            except (requests.RequestException,) as exc:
                last_exc = exc
                wait = self.backoff ** attempt
                time.sleep(wait)
        raise last_exc

    def get_url(self, path):
        """GET a site-relative path (e.g. '/bukhari/3')."""
        if path.startswith("http"):
            return self.get(path)
        return self.get(f"{BASE_URL}{path}")
