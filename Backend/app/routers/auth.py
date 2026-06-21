from __future__ import annotations

from fastapi import APIRouter, status

from app.core.dependencies import CurrentUser, DbSession
from app.schemas.auth import (
    AccessTokenResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
)
from app.schemas.user import UserOut, UserUpdateMe
from app.services.auth_service import AuthService
from app.utils.response import success

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
async def login(payload: LoginRequest, db: DbSession):
    data = await AuthService(db).login(payload.username, payload.password)
    await db.commit()
    return success(TokenResponse(**data), message="Login successful")


@router.post("/refresh")
async def refresh(payload: RefreshRequest, db: DbSession):
    data = await AuthService(db).refresh(payload.refresh_token)
    return success(AccessTokenResponse(**data), message="Token refreshed")


@router.post("/logout")
async def logout(payload: LogoutRequest, db: DbSession):
    await AuthService(db).logout(payload.refresh_token)
    await db.commit()
    return success(None, message="Logged out")


@router.get("/me")
async def me(current_user: CurrentUser):
    return success(UserOut.model_validate(current_user))


@router.put("/me")
async def update_me(payload: UserUpdateMe, current_user: CurrentUser, db: DbSession):
    user = await AuthService(db).update_me(current_user, payload)
    await db.commit()
    return success(UserOut.model_validate(user), message="Profile updated")


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(payload: ChangePasswordRequest, current_user: CurrentUser, db: DbSession):
    await AuthService(db).change_password(current_user, payload)
    await db.commit()
    return success(None, message="Password changed")
