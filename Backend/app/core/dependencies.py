"""Shared FastAPI dependencies: DB session, current user, RBAC."""
from __future__ import annotations

import uuid
from typing import Annotated, Sequence

from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import JWTError, decode_token
from app.database import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

# Bearer scheme — surfaces the "Authorize" button in Swagger UI.
bearer_scheme = HTTPBearer(
    scheme_name="BearerAuth",
    description="Paste the access_token returned by /auth/login",
    auto_error=False,
)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Security(bearer_scheme)
    ] = None,
) -> User:
    if credentials is None or not credentials.credentials:
        raise UnauthorizedError("Missing authentication credentials")

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    repo = UserRepository(db)
    try:
        user = await repo.get_by_id(uuid.UUID(user_id))
    except ValueError:
        raise UnauthorizedError("Invalid token subject")

    if user is None:
        raise UnauthorizedError("User no longer exists")
    if not user.is_active:
        raise ForbiddenError("User account is inactive")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(allowed_roles: Sequence[str]):
    """Dependency factory enforcing that the user has one of `allowed_roles`."""

    async def _checker(current_user: CurrentUser) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"This action requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return _checker


# Convenience dependencies
require_doctor = require_role(["doctor"])
require_staff = require_role(["doctor", "receptionist"])
