from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TourEditRequestCreate(BaseModel):
    reason: str = Field(
        min_length=5,
        max_length=1000,
    )


class TourEditRequestStatusUpdate(BaseModel):
    status: str = Field(
        pattern="^(approved|rejected)$"
    )


class TourEditRequestResponse(BaseModel):
    id: int

    tour_id: int
    organizer_profile_id: int

    reason: str
    status: str

    reviewed_by: int | None = None

    created_at: datetime
    reviewed_at: datetime | None = None
    used_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )