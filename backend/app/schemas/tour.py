from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class TourBase(BaseModel):
    title: str = Field(
        min_length=4,
        max_length=120,
    )

    slug: str = Field(
        min_length=4,
        max_length=140,
    )

    description: str = Field(
        min_length=20,
        max_length=5000,
    )

    category_id: int
    region_id: int

    district: str | None = None
    meeting_point: str | None = None

    latitude: float | None = None
    longitude: float | None = None

    price: float = Field(
        ge=0,
    )

    duration: str = Field(
        min_length=1,
        max_length=40,
    )

    start_date: datetime

    end_date: datetime | None = None

    maximum_people: int = Field(
        ge=1,
    )

    transport: str = Field(
        default="Bus",
        max_length=20,
    )

    accommodation: str | None = None

    included: str | None = None
    excluded: str | None = None
    requirements: str | None = None

    images: list[str] = []


# ============================================================
# CREATE
# ============================================================

class TourCreate(TourBase):
    pass


# ============================================================
# UPDATE
# ============================================================

class TourUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=4,
        max_length=120,
    )

    slug: str | None = Field(
        default=None,
        min_length=4,
        max_length=140,
    )

    description: str | None = Field(
        default=None,
        min_length=20,
        max_length=5000,
    )

    category_id: int | None = None
    region_id: int | None = None

    district: str | None = None
    meeting_point: str | None = None

    latitude: float | None = None
    longitude: float | None = None

    price: float | None = Field(
        default=None,
        ge=0,
    )

    duration: str | None = Field(
        default=None,
        min_length=1,
        max_length=40,
    )

    start_date: datetime | None = None
    end_date: datetime | None = None

    maximum_people: int | None = Field(
        default=None,
        ge=1,
    )

    transport: str | None = Field(
        default=None,
        max_length=20,
    )

    accommodation: str | None = None

    included: str | None = None
    excluded: str | None = None
    requirements: str | None = None

    images: list[str] | None = None


# ============================================================
# RESPONSE
# ============================================================

class TourResponse(TourBase):
    id: int

    available_seats: int

    status: str

    rating: float
    reviews_count: int

    organizer_profile_id: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# ADMIN STATUS
# ============================================================

class TourStatusUpdate(BaseModel):
    status: str = Field(
        pattern="^(approved|rejected)$"
    )