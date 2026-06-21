"""Import all models so Alembic and SQLAlchemy metadata see them."""
from app.models.appointment import Appointment  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.expense import Expense  # noqa: F401
from app.models.invoice import Invoice  # noqa: F401
from app.models.invoice_item import InvoiceItem  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.prescription import Prescription  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
from app.models.service import Service  # noqa: F401
from app.models.settings import ClinicSettings  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.visit import Visit  # noqa: F401

__all__ = [
    "Appointment",
    "Doctor",
    "Document",
    "Expense",
    "Invoice",
    "InvoiceItem",
    "Notification",
    "Patient",
    "Prescription",
    "RefreshToken",
    "Service",
    "ClinicSettings",
    "User",
    "Visit",
]
