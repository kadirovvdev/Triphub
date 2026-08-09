from datetime import datetime

from sqlalchemy import (
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"

    __table_args__ = (
        UniqueConstraint(
            "traveler_id",
            "tour_id",
            name="uq_reviews_traveler_tour",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    traveler_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    tour_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    organizer_profile_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    comment: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    traveler_name: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    traveler_avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )