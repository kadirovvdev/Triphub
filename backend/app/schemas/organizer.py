from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ============================================================
# BASE
# ============================================================

class OrganizerBase(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=80,
    )

    bio: str | None = Field(
        default=None,
        max_length=1200,
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=500,
    )

    cover_url: str | None = Field(
        default=None,
        max_length=500,
    )

    phone: str | None = Field(
        default=None,
        max_length=32,
    )


# ============================================================
# CREATE
# ============================================================

class OrganizerCreate(OrganizerBase):
    pass


# ============================================================
# UPDATE
# ============================================================

class OrganizerUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
    )

    bio: str | None = Field(
        default=None,
        max_length=1200,
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=500,
    )

    cover_url: str | None = Field(
        default=None,
        max_length=500,
    )

    phone: str | None = Field(
        default=None,
        max_length=32,
    )


# ============================================================
# RESPONSE
# ============================================================

class OrganizerResponse(OrganizerBase):
    id: int
    user_id: int

    verification_status: str
    verified: bool

    rating: float
    reviews_count: int
    tours_count: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# ADMIN STATUS
# ============================================================

class OrganizerStatusUpdate(BaseModel):
    status: str = Field(
        pattern="^(approved|rejected|pending)$"
    )