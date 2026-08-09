from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FavoriteResponse(BaseModel):
    id: int
    traveler_id: int
    tour_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )