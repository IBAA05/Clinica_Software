"""Async SMTP email sending using aiosmtplib."""
from __future__ import annotations

import logging
from email.message import EmailMessage
from typing import Optional

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger("clinic.email")


async def send_email(
    to: str,
    subject: str,
    body: str,
    *,
    html: Optional[str] = None,
    attachment: Optional[bytes] = None,
    attachment_name: str = "document.pdf",
    attachment_mime: tuple[str, str] = ("application", "pdf"),
) -> bool:
    """Send an email asynchronously. Returns True on success, False on failure.

    Failures are swallowed and logged so background tasks never crash the request.
    """
    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    if html:
        message.add_alternative(html, subtype="html")
    if attachment is not None:
        maintype, subtype = attachment_mime
        message.add_attachment(
            attachment, maintype=maintype, subtype=subtype, filename=attachment_name
        )

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=settings.SMTP_USE_TLS,
            timeout=20,
        )
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as exc:  # pragma: no cover - network dependent
        logger.warning("Failed to send email to %s: %s", to, exc)
        return False
