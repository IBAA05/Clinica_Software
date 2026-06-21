from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class TokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def store(self, jti: str, user_id, expires_at: datetime) -> RefreshToken:
        token = RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at)
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_by_jti(self, jti: str) -> Optional[RefreshToken]:
        res = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
        return res.scalar_one_or_none()

    async def revoke(self, jti: str) -> bool:
        token = await self.get_by_jti(jti)
        if token is None:
            return False
        token.revoked = True
        await self.db.flush()
        return True

    async def is_active(self, jti: str) -> bool:
        token = await self.get_by_jti(jti)
        return bool(token and not token.revoked)
