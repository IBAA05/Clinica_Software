from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError, ValidationError
from app.core.security import (
    JWTError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.token_repository import TokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import ChangePasswordRequest, UserPublic
from app.schemas.user import UserUpdateMe


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)
        self.tokens = TokenRepository(db)

    async def login(self, username: str, password: str) -> dict:
        user = await self.users.get_by_username(username)
        if user is None or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid username or password")
        if not user.is_active:
            raise UnauthorizedError("Account is inactive")

        user.last_login = datetime.now(timezone.utc)
        access = create_access_token(user.id, user.role.value)
        refresh, jti, expires_at = create_refresh_token(user.id, user.role.value)
        await self.tokens.store(jti, user.id, expires_at)
        await self.db.flush()
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": UserPublic(
                id=user.id,
                name=user.full_name,
                role=user.role,
                email=user.email,
                avatar_url=user.avatar_url,
            ),
        }

    async def refresh(self, refresh_token: str) -> dict:
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedError("Invalid refresh token")
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")
        jti = payload.get("jti")
        if not jti or not await self.tokens.is_active(jti):
            raise UnauthorizedError("Refresh token has been revoked")
        user = await self.users.get_by_id(uuid.UUID(payload["sub"]))
        if user is None or not user.is_active:
            raise UnauthorizedError("User not found or inactive")
        access = create_access_token(user.id, user.role.value)
        return {"access_token": access, "token_type": "bearer"}

    async def logout(self, refresh_token: str) -> bool:
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise UnauthorizedError("Invalid refresh token")
        jti = payload.get("jti")
        if jti:
            await self.tokens.revoke(jti)
        return True

    async def update_me(self, user: User, data: UserUpdateMe) -> User:
        if data.email and data.email != user.email:
            existing = await self.users.get_by_email(data.email)
            if existing and existing.id != user.id:
                raise ConflictError("Email already in use")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise ValidationError("Current password is incorrect")
        user.hashed_password = hash_password(data.new_password)
        await self.db.flush()
