"""Shared enumerations used by models and schemas."""
import enum


class UserRole(str, enum.Enum):
    doctor = "doctor"
    receptionist = "receptionist"


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class BloodType(str, enum.Enum):
    a_pos = "A+"
    a_neg = "A-"
    b_pos = "B+"
    b_neg = "B-"
    ab_pos = "AB+"
    ab_neg = "AB-"
    o_pos = "O+"
    o_neg = "O-"


class PatientStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    checked_in = "checked_in"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class AppointmentType(str, enum.Enum):
    consultation = "consultation"
    followup = "followup"
    procedure = "procedure"
    checkup = "checkup"
    emergency = "emergency"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    insurance = "insurance"
    bank_transfer = "bank_transfer"


class InvoiceStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    partial = "partial"
    overdue = "overdue"


class ServiceType(str, enum.Enum):
    consultation = "consultation"
    followup = "followup"
    procedure = "procedure"
    lab = "lab"
    medication = "medication"
    other = "other"


class ExpenseCategory(str, enum.Enum):
    salaries = "salaries"
    rent = "rent"
    supplies = "supplies"
    equipment = "equipment"
    utilities = "utilities"
    marketing = "marketing"
    other = "other"


class NotificationType(str, enum.Enum):
    email = "email"
    internal = "internal"


class NotificationStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"
    pending = "pending"
    unread = "unread"
    read = "read"


class RelatedEntity(str, enum.Enum):
    appointment = "appointment"
    invoice = "invoice"
    visit = "visit"
