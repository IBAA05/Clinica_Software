"""Standard response envelope helpers.

All endpoints return:
    { "success": bool, "data": any, "message": str, "pagination"?: {...} }
"""
from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "OK"
    pagination: Optional[PaginationMeta] = None


def success(
    data: Any = None,
    message: str = "OK",
    pagination: Optional[PaginationMeta] = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"success": True, "data": data, "message": message}
    if pagination is not None:
        body["pagination"] = (
            pagination.model_dump()
            if isinstance(pagination, PaginationMeta)
            else pagination
        )
    return body


def make_pagination(page: int, limit: int, total: int) -> PaginationMeta:
    total_pages = (total + limit - 1) // limit if limit else 0
    return PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )
