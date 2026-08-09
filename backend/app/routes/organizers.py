from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.routes import (
    get_current_admin_user,
    get_current_organizer_user,
)

from app.database import SessionLocal

from app.models.organizer_profile import (
    OrganizerProfile,
)

from app.models.user import User

from app.schemas.organizer import (
    OrganizerCreate,
    OrganizerResponse,
    OrganizerStatusUpdate,
    OrganizerUpdate,
)


router = APIRouter(
    prefix="/organizers",
    tags=["Organizers"],
)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# GET ALL
# ============================================================

@router.get(
    "",
    response_model=list[OrganizerResponse],
)
def get_organizers(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(
            OrganizerProfile
        ).order_by(
            OrganizerProfile.id.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# GET CURRENT ORGANIZER PROFILE
#
# MUHIM:
# /me route /{organizer_id} dan OLDIN bo'lishi kerak.
# ============================================================

@router.get(
    "/me",
    response_model=OrganizerResponse,
)
def get_my_organizer_profile(
    current_user: User = Depends(
        get_current_organizer_user
    ),
    db: Session = Depends(get_db),
):
    organizer = (
        db.query(
            OrganizerProfile
        )
        .filter(
            OrganizerProfile.user_id
            == current_user.id
        )
        .first()
    )

    if not organizer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )

    return organizer


# ============================================================
# UPDATE CURRENT ORGANIZER PROFILE
# ============================================================

@router.patch(
    "/me",
    response_model=OrganizerResponse,
)
def update_my_organizer_profile(
    data: OrganizerUpdate,
    current_user: User = Depends(
        get_current_organizer_user
    ),
    db: Session = Depends(get_db),
):
    organizer = (
        db.query(
            OrganizerProfile
        )
        .filter(
            OrganizerProfile.user_id
            == current_user.id
        )
        .first()
    )

    if not organizer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            organizer,
            field,
            value,
        )

    db.commit()
    db.refresh(organizer)

    return organizer


# ============================================================
# GET SINGLE ORGANIZER
# ============================================================

@router.get(
    "/{organizer_id}",
    response_model=OrganizerResponse,
)
def get_organizer(
    organizer_id: int,
    db: Session = Depends(get_db),
):
    organizer = db.get(
        OrganizerProfile,
        organizer_id,
    )

    if not organizer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer not found",
        )

    return organizer


# ============================================================
# CREATE ORGANIZER PROFILE
# ============================================================

@router.post(
    "",
    response_model=OrganizerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organizer(
    data: OrganizerCreate,
    current_user: User = Depends(
        get_current_organizer_user
    ),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(
            OrganizerProfile
        )
        .filter(
            OrganizerProfile.user_id
            == current_user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organizer profile already exists for this user",
        )

    organizer = OrganizerProfile(
        user_id=current_user.id,

        full_name=data.full_name,
        bio=data.bio,

        avatar_url=data.avatar_url,
        cover_url=data.cover_url,

        phone=data.phone,

        verification_status="pending",
        verified=False,
    )

    db.add(organizer)
    db.commit()
    db.refresh(organizer)

    return organizer


# ============================================================
# ADMIN VERIFICATION
# ============================================================

@router.patch(
    "/{organizer_id}/status",
    response_model=OrganizerResponse,
)
def update_organizer_status(
    organizer_id: int,
    data: OrganizerStatusUpdate,
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    organizer = db.get(
        OrganizerProfile,
        organizer_id,
    )

    if not organizer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer not found",
        )

    organizer.verification_status = (
        data.status
    )

    organizer.verified = (
        data.status == "approved"
    )

    db.commit()
    db.refresh(organizer)

    return organizer