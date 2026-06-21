"""Application entry point — FastAPI app factory, CORS, router registration."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers

from app.routers import (
    auth,
    patients,
    doctor,
    appointments,
    visits,
    invoices,
    expenses,
)


def create_app() -> FastAPI:
    """Build and return the FastAPI application instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        debug=settings.DEBUG,
    )

    # ── CORS ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ──────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ─────────────────────────────────────────────────────────
    prefix = settings.API_V1_PREFIX

    app.include_router(auth.router, prefix=prefix)
    app.include_router(patients.router, prefix=prefix)
    app.include_router(doctor.router, prefix=prefix)
    app.include_router(appointments.router, prefix=prefix)
    app.include_router(visits.router, prefix=prefix)
    app.include_router(invoices.router, prefix=prefix)
    app.include_router(expenses.router, prefix=prefix)

    # ── Health check ────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
