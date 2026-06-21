"""Bundled ICD-10 code search (no external API)."""
from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import List

_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "icd10.json")


@lru_cache
def _load() -> List[dict]:
    path = os.path.abspath(_DATA_PATH)
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def search_icd(query: str, limit: int = 20) -> List[dict]:
    q = (query or "").strip().lower()
    if not q:
        return []
    results = []
    for entry in _load():
        if q in entry["code"].lower() or q in entry["description"].lower():
            results.append(entry)
        if len(results) >= limit:
            break
    return results
