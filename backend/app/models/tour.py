from datetime import datetime
from enum import Enum

from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TransportType(str, Enum):
    NONE = "None"
    BUS = "Bus"
    MINIVAN = "Minivan"
    CAR = "Car"
    TRAIN = "Train"
    FLIGHT = "Flight"


class TourStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Tour(Base):
    __tablename__ = "tours"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(140),
        unique=True,
        index=True,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"),
        nullable=True,
    )

    region_id: Mapped[int | None] = mapped_column(
        ForeignKey("regions.id"),
        nullable=True,
    )

    district: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )

    meeting_point: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True,
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    price: Mapped[float] = mapped_column(
        nullable=False,
        default=0,
    )

    duration: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )

    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    maximum_people: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
    )

    available_seats: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
    )

    transport: Mapped[TransportType] = mapped_column(
        String(20),
        nullable=False,
        default=TransportType.BUS,
    )

    accommodation: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    included: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    excluded: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[TourStatus] = mapped_column(
        String(20),
        nullable=False,
        default=TourStatus.PENDING,
    )

    images: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True,
        default=list,
    )

    rating: Mapped[float] = mapped_column(
        nullable=False,
        default=0,
    )

    reviews_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    organizer_profile_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizer_profiles.id"),
        nullable=True,
    )