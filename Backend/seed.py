"""Seed script: creates tables and inserts initial data.

Run with:  python seed.py

Creates:
  - 1 doctor user + doctor profile
  - 1 receptionist user
  - ClinicSettings singleton
  - 5 default services with prices
  - 3 sample patients
"""
from __future__ import annotations

import asyncio
from datetime import date
from decimal import Decimal

from app.core.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.doctor import Doctor, default_schedule
from app.models.enums import BloodType, Gender, PatientStatus, ServiceType, UserRole
from app.models.patient import Patient
from app.models.service import Service
from app.models.settings import ClinicSettings
from app.models.user import User
from sqlalchemy import select


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed() -> None:
    await create_tables()
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(User).where(User.username == "doctor"))
        if existing:
            print("Seed data already present; skipping.")
            return

        doctor_user = User(
            username="doctor",
            full_name="Dr. Sarah Johnson",
            email="doctor@clinic.test",
            hashed_password=hash_password("Doctor@123"),
            role=UserRole.doctor,
            is_active=True,
        )
        receptionist = User(
            username="reception",
            full_name="Mark Reception",
            email="reception@clinic.test",
            hashed_password=hash_password("Reception@123"),
            role=UserRole.receptionist,
            is_active=True,
        )
        db.add_all([doctor_user, receptionist])
        await db.flush()

        db.add(
            Doctor(
                user_id=doctor_user.id,
                full_name="Dr. Sarah Johnson",
                specialty="General Medicine",
                qualification="MD, MRCP",
                registration_number="REG-100245",
                phone="+1-555-0100",
                email="doctor@clinic.test",
                bio="Experienced general practitioner.",
                consultation_fee=Decimal("75.00"),
                followup_fee=Decimal("45.00"),
                schedule=default_schedule(),
                slot_duration_minutes=30,
                max_daily_appointments=20,
            )
        )

        db.add(
            ClinicSettings(
                clinic_name="Bright Health Clinic",
                address="123 Wellness Ave, Springfield",
                phone="+1-555-0199",
                email="info@brighthealth.test",
                website="https://brighthealth.test",
                tax_rate=Decimal("5.00"),
                currency="USD",
                appointment_reminder_hours=[1, 24],
            )
        )

        db.add_all([
            Service(name="Consultation", service_type=ServiceType.consultation, default_price=Decimal("75.00")),
            Service(name="Follow-up", service_type=ServiceType.followup, default_price=Decimal("45.00")),
            Service(name="Minor Procedure", service_type=ServiceType.procedure, default_price=Decimal("150.00")),
            Service(name="Lab Test", service_type=ServiceType.lab, default_price=Decimal("40.00")),
            Service(name="Medication Dispensing", service_type=ServiceType.medication, default_price=Decimal("25.00")),
        ])

        db.add_all([
            Patient(
                full_name="John Smith",
                date_of_birth=date(1985, 4, 12),
                gender=Gender.male,
                phone="+1-555-1001",
                email="john.smith@example.com",
                address="45 Oak Street",
                blood_type=BloodType.o_pos,
                national_id="NID-0001",
                emergency_contact_name="Jane Smith",
                emergency_contact_phone="+1-555-1002",
                insurance_provider="HealthSecure",
                insurance_number="HS-99001",
                allergies=["Penicillin"],
                chronic_conditions=["Hypertension"],
                status=PatientStatus.active,
            ),
            Patient(
                full_name="Maria Garcia",
                date_of_birth=date(1992, 9, 30),
                gender=Gender.female,
                phone="+1-555-1003",
                email="maria.garcia@example.com",
                address="78 Pine Road",
                blood_type=BloodType.a_pos,
                national_id="NID-0002",
                emergency_contact_name="Carlos Garcia",
                emergency_contact_phone="+1-555-1004",
                allergies=[],
                chronic_conditions=[],
                status=PatientStatus.active,
            ),
            Patient(
                full_name="Liam O'Brien",
                date_of_birth=date(2015, 1, 20),
                gender=Gender.male,
                phone="+1-555-1005",
                email="obrien.family@example.com",
                address="12 Maple Lane",
                blood_type=BloodType.b_neg,
                national_id="NID-0003",
                emergency_contact_name="Emma O'Brien",
                emergency_contact_phone="+1-555-1006",
                insurance_provider="KidsCare",
                insurance_number="KC-44012",
                allergies=["Peanuts", "Dust"],
                chronic_conditions=["Asthma"],
                status=PatientStatus.active,
            ),
        ])

        await db.commit()
        print("Seed complete.")
        print("  Doctor login:       doctor / Doctor@123")
        print("  Receptionist login: reception / Reception@123")


if __name__ == "__main__":
    asyncio.run(seed())
