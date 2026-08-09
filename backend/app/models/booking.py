from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class BookingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    tour_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    traveler_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    organizer_profile_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    seats: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    full_name: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[BookingStatus] = mapped_column(
        SQLEnum(
            BookingStatus,
            name="booking_status",
        ),
        nullable=False,
        default=BookingStatus.PENDING,
    )

    total_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )