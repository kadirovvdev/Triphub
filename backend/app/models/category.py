from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(60),
        unique=True,
        index=True,
        nullable=False,
    )

    icon: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="compass",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )