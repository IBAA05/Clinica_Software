"""Common pagination query params for list endpoints."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Query


@dataclass
class PageParams:
    page: int
    limit: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


def pagination_params(
    page: int = Query(1, ge=1, description="1-based page number"),
    limit: int = Query(20, ge=1, le=200, description="Items per page"),
) -> PageParams:
    return PageParams(page=page, limit=limit)
