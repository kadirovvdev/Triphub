from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class AdminUserResponse(BaseModel):
    id: int
    email: str
    role: UserRole

    avatar_url: str | None = None
    phone: str | None = None
    bio: str | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )