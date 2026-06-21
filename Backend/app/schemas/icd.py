from __future__ import annotations

from pydantic import BaseModel


class ICDCode(BaseModel):
    code: str
    description: str
