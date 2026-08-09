from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class ReviewCreate(BaseModel):
    tour_id: int

    rating: int = Field(
        ...,
        ge=1,
        le=5,
    )

    comment: str = Field(
        ...,
        min_length=3,
        max_length=2000,
    )


class ReviewResponse(BaseModel):
    id: int

    traveler_id: int

    tour_id: int

    organizer_profile_id: int | None

    rating: int

    comment: str

    traveler_name: str | None

    traveler_avatar_url: str | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )