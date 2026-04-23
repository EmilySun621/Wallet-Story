"""
data_fetcher.py — Polymarket + Polygon data retrieval for WalletStory.

Fetches:
  1. Polymarket trade activity (Data API, paginated)
  2. Polymarket market metadata & resolution (Gamma API)
  3. Polygon ERC-20 / native transfers (Alchemy or Polygonscan)
"""

import os
import time
import json
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

log = logging.getLogger("data_fetcher")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DATA_API = "https://data-api.polymarket.com"
GAMMA_API = "https://gamma-api.polymarket.com"
PAGE_SIZE = 1000          # max allowed by the Data API
RATE_LIMIT_PAUSE = 0.25   # seconds between paginated requests

ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
POLYGONSCAN_API_KEY = os.getenv("POLYGONSCAN_API_KEY", "")

ALCHEMY_POLYGON_URL = (
    f"https://polygon-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
    if ALCHEMY_API_KEY
    else ""
)


# ===================================================================
# 1.  Polymarket trades  (Data API)
# ===================================================================

def fetch_polymarket_trades(address: str, max_pages: int = 20) -> list[dict]:
    """
    Return every TRADE record for *address* from the Polymarket Data API.
    Paginates via offset until fewer than PAGE_SIZE rows are returned.
    """
    address = address.lower()
    all_trades: list[dict] = []
    offset = 0

    for _ in range(max_pages):
        url = (
            f"{DATA_API}/activity"
            f"?user={address}&type=TRADE&limit={PAGE_SIZE}&offset={offset}"
        )
        resp = requests.get(url, timeout=30)
        if resp.status_code >= 400:
            # API returns 400 when offset exceeds available data
            break
        page = resp.json()

        if not page or not isinstance(page, list):
            break

        all_trades.extend(page)
        log.info("  fetched %d trades (offset=%d)", len(page), offset)

        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
        time.sleep(RATE_LIMIT_PAUSE)

    log.info("Total trades for %s: %d", address[:10], len(all_trades))
    return all_trades


def fetch_polymarket_activity(address: str, max_pages: int = 20) -> list[dict]:
    """
    Return ALL activity (TRADE + REDEEM + MERGE + REWARD) for *address*.
    """
    address = address.lower()
    all_activity: list[dict] = []
    offset = 0

    for _ in range(max_pages):
        url = (
            f"{DATA_API}/activity"
            f"?user={address}&limit={PAGE_SIZE}&offset={offset}"
        )
        resp = requests.get(url, timeout=30)
        if resp.status_code >= 400:
            break
        page = resp.json()
        if not page or not isinstance(page, list):
            break
        all_activity.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
        time.sleep(RATE_LIMIT_PAUSE)

    return all_activity


# ===================================================================
# 2.  Market resolution  (Gamma API + event lookup)
# ===================================================================

_market_cache: dict[str, dict] = {}


def fetch_market_by_slug(slug: str) -> dict | None:
    """
    Look up a Polymarket market by its slug.
    For negRisk markets, searches inside event.markets[].
    Caches results in-memory.
    """
    if slug in _market_cache:
        return _market_cache[slug]

    # Try direct market lookup first
    url = f"{GAMMA_API}/markets?slug={slug}&limit=1"
    resp = requests.get(url, timeout=15)
    if resp.ok:
        markets = resp.json()
        if markets and markets[0].get("slug") == slug:
            _market_cache[slug] = markets[0]
            return markets[0]

    # For negRisk markets: try the event lookup using eventSlug
    # The slug path usually maps: event has markets nested inside
    # We'll cache None if we can't find it
    _market_cache[slug] = None
    return None


def _resolve_via_event(event_slug: str) -> dict[str, str]:
    """
    Fetch an event and return {slug: winning_outcome} for all its markets.
    """
    url = f"{GAMMA_API}/events?slug={event_slug}&limit=1"
    resp = requests.get(url, timeout=15)
    if not resp.ok:
        return {}
    events = resp.json()
    if not events:
        return {}

    result = {}
    for mkt in events[0].get("markets", []):
        s = mkt.get("slug", "")
        if not s:
            continue
        try:
            outcomes = json.loads(mkt.get("outcomes", "[]"))
            prices = json.loads(mkt.get("outcomePrices", "[]"))
        except (json.JSONDecodeError, TypeError):
            continue
        for label, price_str in zip(outcomes, prices):
            try:
                if float(price_str) >= 0.99:
                    result[s] = label
                    break
            except ValueError:
                continue
    return result


_event_resolution_cache: dict[str, dict[str, str]] = {}


def get_resolved_outcome_by_slug(slug: str, event_slug: str = "") -> str | None:
    """
    For a resolved market, return the winning outcome label (e.g. "Yes"/"No").
    Uses slug + event_slug for reliable lookup (handles negRisk markets).
    Returns None if the market is still open or data is unavailable.
    """
    # Try direct market lookup
    market = fetch_market_by_slug(slug)
    if market:
        try:
            outcomes = json.loads(market.get("outcomes", "[]"))
            prices = json.loads(market.get("outcomePrices", "[]"))
            for label, price_str in zip(outcomes, prices):
                if float(price_str) >= 0.99:
                    return label
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    # Fall back to event-based resolution
    if event_slug:
        if event_slug not in _event_resolution_cache:
            _event_resolution_cache[event_slug] = _resolve_via_event(event_slug)
            time.sleep(0.1)
        resolutions = _event_resolution_cache[event_slug]
        if slug in resolutions:
            return resolutions[slug]

    return None


# ===================================================================
# 3.  Classify trades as win / loss
# ===================================================================

def classify_trades(trades: list[dict]) -> list[dict]:
    """
    Annotate each trade with a 'won' boolean field.

    Logic:
      - BUY  outcome X  +  X resolved  → win
      - BUY  outcome X  +  X didn't resolve → loss
      - SELL trades are exits; marked won=None (excluded from win-rate)
      - Unresolved markets → won=None

    Returns trades with added 'won' and 'resolved_outcome' fields.
    """
    # Pre-fetch resolutions for all unique slug+eventSlug combos
    slug_event_pairs = {
        (t.get("slug", ""), t.get("eventSlug", ""))
        for t in trades
        if t.get("slug")
    }
    log.info("Resolving %d unique markets via slug...", len(slug_event_pairs))

    resolutions: dict[str, str | None] = {}
    for slug, event_slug in slug_event_pairs:
        resolutions[slug] = get_resolved_outcome_by_slug(slug, event_slug)

    annotated = []
    for t in trades:
        t = dict(t)  # shallow copy
        slug = t.get("slug", "")
        resolved = resolutions.get(slug)
        t["resolved_outcome"] = resolved

        if t.get("side") == "SELL" or resolved is None:
            t["won"] = None
        else:
            t["won"] = (t.get("outcome") == resolved)

        annotated.append(t)

    return annotated


# ===================================================================
# 4.  Polygon on-chain transfers  (Alchemy / Polygonscan)
# ===================================================================

def fetch_polygon_transfers(
    address: str,
    limit: int = 1000,
    direction: str = "both",
) -> list[dict]:
    """
    Fetch ERC-20 + native token transfers for *address* on Polygon.
    Uses Alchemy's asset-transfers API if ALCHEMY_API_KEY is set,
    otherwise falls back to Polygonscan.

    Returns list of dicts with keys: from, to, value, asset, hash, block.
    """
    address = address.lower()

    if ALCHEMY_POLYGON_URL:
        return _fetch_transfers_alchemy(address, limit, direction)
    elif POLYGONSCAN_API_KEY:
        return _fetch_transfers_polygonscan(address, limit)
    else:
        log.warning(
            "No ALCHEMY_API_KEY or POLYGONSCAN_API_KEY set. "
            "Cannot fetch Polygon transfers."
        )
        return []


def _fetch_transfers_alchemy(
    address: str, limit: int, direction: str
) -> list[dict]:
    """Alchemy alchemy_getAssetTransfers for Polygon."""
    results: list[dict] = []
    categories = ["external", "erc20"]

    directions = []
    if direction in ("both", "from"):
        directions.append("from")
    if direction in ("both", "to"):
        directions.append("to")

    for d in directions:
        params = {
            "category": categories,
            "maxCount": hex(min(limit, 1000)),
            "withMetadata": True,
            "order": "desc",
        }
        if d == "from":
            params["fromAddress"] = address
        else:
            params["toAddress"] = address

        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "alchemy_getAssetTransfers",
            "params": [params],
        }

        resp = requests.post(ALCHEMY_POLYGON_URL, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json().get("result", {})

        for tx in data.get("transfers", []):
            results.append({
                "from": tx.get("from", "").lower(),
                "to": tx.get("to", "").lower(),
                "value": tx.get("value", 0),
                "asset": tx.get("asset", "MATIC"),
                "hash": tx.get("hash", ""),
                "block": int(tx.get("blockNum", "0x0"), 16),
            })

    return results[:limit]


def _fetch_transfers_polygonscan(address: str, limit: int) -> list[dict]:
    """Polygonscan txlist as fallback."""
    url = (
        f"https://api.polygonscan.com/api"
        f"?module=account&action=txlist&address={address}"
        f"&startblock=0&endblock=99999999&page=1&offset={limit}"
        f"&sort=desc&apikey={POLYGONSCAN_API_KEY}"
    )
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for tx in data.get("result", []):
        if isinstance(tx, str):
            break  # API error message
        results.append({
            "from": tx.get("from", "").lower(),
            "to": tx.get("to", "").lower(),
            "value": int(tx.get("value", 0)) / 1e18,
            "asset": "MATIC",
            "hash": tx.get("hash", ""),
            "block": int(tx.get("blockNumber", 0)),
        })
    return results


def fetch_counterparties(
    address: str,
    max_hops: int = 2,
    tx_limit_per_hop: int = 500,
) -> list[tuple[str, str, float]]:
    """
    Build a list of (src, dst, value) edges by crawling transfers
    up to *max_hops* from the seed *address*.

    Returns edges suitable for clustering.build_graph().
    """
    address = address.lower()
    visited: set[str] = set()
    frontier: set[str] = {address}
    edges: list[tuple[str, str, float]] = []

    for hop in range(max_hops):
        next_frontier: set[str] = set()
        for addr in frontier:
            if addr in visited:
                continue
            visited.add(addr)
            transfers = fetch_polygon_transfers(
                addr, limit=tx_limit_per_hop, direction="both"
            )
            for tx in transfers:
                src = tx["from"]
                dst = tx["to"]
                val = tx.get("value", 0) or 0
                if val > 0:
                    edges.append((src, dst, val))
                    if src not in visited:
                        next_frontier.add(src)
                    if dst not in visited:
                        next_frontier.add(dst)

        frontier = next_frontier
        log.info(
            "Hop %d complete: %d visited, %d edges, %d in next frontier",
            hop + 1, len(visited), len(edges), len(frontier),
        )

    return edges


# ===================================================================
# CLI smoke test
# ===================================================================

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")

    # Load the case file
    case_path = Path(__file__).resolve().parent / "data" / "case_polymarket_theo.json"
    with open(case_path) as f:
        case = json.load(f)

    verified = [a for a in case["addresses"] if a.get("verified")]
    print(f"\n=== Smoke test: fetching trades for {len(verified)} verified wallets ===\n")

    for wallet in verified:
        addr = wallet["address"]
        name = wallet["username"]
        trades = fetch_polymarket_trades(addr, max_pages=2)
        print(f"  {name} ({addr[:10]}...): {len(trades)} trades (first 2 pages)")

    # Classify a small sample
    if verified:
        sample = fetch_polymarket_trades(verified[0]["address"], max_pages=1)
        classified = classify_trades(sample[:50])
        wins = sum(1 for t in classified if t.get("won") is True)
        losses = sum(1 for t in classified if t.get("won") is False)
        skipped = sum(1 for t in classified if t.get("won") is None)
        print(f"\n  Sample classification ({verified[0]['username']}, 50 trades):")
        print(f"    wins={wins}, losses={losses}, skipped={skipped}")

    # Transfer test (requires Alchemy or Polygonscan key)
    if ALCHEMY_API_KEY or POLYGONSCAN_API_KEY:
        print("\n=== Polygon transfers test ===")
        tx = fetch_polygon_transfers(verified[0]["address"], limit=5)
        print(f"  {len(tx)} transfers fetched for {verified[0]['username']}")
    else:
        print("\n  [skip] No Alchemy/Polygonscan key — transfer fetch skipped")
