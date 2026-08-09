from pydantic import BaseModel, ConfigDict, Field

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    tour_id: int

    seats: int = Field(
        default=1,
        ge=1,
    )

    full_name: str = Field(
        min_length=2,
        max_length=80,
    )

    phone: str = Field(
        min_length=5,
        max_length=32,
    )

    note: str | None = Field(
        default=None,
        max_length=500,
    )


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingResponse(BaseModel):
    id: int
    tour_id: int
    traveler_id: int
    organizer_profile_id: int | None

    seats: int

    full_name: str
    phone: str
    note: str | None

    status: BookingStatus
    total_price: float

    model_config = ConfigDict(
        from_attributes=True,
    )
