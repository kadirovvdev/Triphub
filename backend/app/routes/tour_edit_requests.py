from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.auth.routes import get_current_organizer_user
from app.database import SessionLocal

from app.models.booking import (
    Booking,
    BookingStatus,
)

from app.models.organizer_profile import OrganizerProfile
from app.models.tour import Tour
from app.models.tour_edit_request import TourEditRequest
from app.models.user import User

from app.schemas.tour_edit_request import (
    TourEditRequestCreate,
    TourEditRequestResponse,
)


router = APIRouter(
    prefix="/tour-edit-requests",
    tags=["Tour Edit Requests"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# GET MY REQUESTS
# ============================================================

@router.get(
    "/mine",
    response_model=list[TourEditRequestResponse],
)
def get_my_edit_requests(
    current_user: User = Depends(
        get_current_organizer_user
    ),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(OrganizerProfile)
        .filter(
            OrganizerProfile.user_id
            == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )

    return (
        db.query(TourEditRequest)
        .filter(
            TourEditRequest.organizer_profile_id
            == profile.id
        )
        .order_by(
            TourEditRequest.id.desc()
        )
        .all()
    )


# ============================================================
# CREATE EDIT REQUEST
# ============================================================

@router.post(
    "/tours/{tour_id}",
    response_model=TourEditRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_edit_request(
    tour_id: int,
    data: TourEditRequestCreate,
    current_user: User = Depends(
        get_current_organizer_user
    ),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(OrganizerProfile)
        .filter(
            OrganizerProfile.user_id
            == current_user.id
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )

    tour = db.get(
        Tour,
        tour_id,
    )

    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )

    if (
        tour.organizer_profile_id
        != profile.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only request edits for your own tours",
        )

    # --------------------------------------------------------
    # ACTIVE BOOKINGS
    # --------------------------------------------------------

    active_booking = (
        db.query(Booking)
        .filter(
            Booking.tour_id == tour.id,
            Booking.status.in_(
                [
                    BookingStatus.PENDING,
                    BookingStatus.APPROVED,
                ]
            ),
        )
        .first()
    )

    if not active_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This tour has no active bookings. "
                "You can edit it directly."
            ),
        )

    # --------------------------------------------------------
    # DUPLICATE REQUEST CHECK
    # --------------------------------------------------------

    existing_request = (
        db.query(TourEditRequest)
        .filter(
            TourEditRequest.tour_id
            == tour.id,

            TourEditRequest.organizer_profile_id
            == profile.id,

            TourEditRequest.status.in_(
                [
                    "pending",
                    "approved",
                ]
            ),

            TourEditRequest.used_at.is_(None),
        )
        .order_by(
            TourEditRequest.id.desc()
        )
        .first()
    )

    if existing_request:
        if (
            existing_request.status
            == "pending"
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An edit request for this tour "
                    "is already pending"
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An approved edit permission "
                "already exists for this tour"
            ),
        )

    edit_request = TourEditRequest(
        tour_id=tour.id,
        organizer_profile_id=profile.id,
        reason=data.reason.strip(),
        status="pending",
    )

    db.add(edit_request)
    db.commit()
    db.refresh(edit_request)

    return edit_request