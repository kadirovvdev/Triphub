from datetime import datetime, timezone

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

from app.models.booking import (
    Booking,
    BookingStatus,
)

from app.models.organizer_profile import OrganizerProfile
from app.models.tour import Tour
from app.models.tour_edit_request import TourEditRequest
from app.models.user import User

from app.schemas.tour import (
    TourCreate,
    TourResponse,
    TourStatusUpdate,
    TourUpdate,
)


router = APIRouter(
    prefix="/tours",
    tags=["Tours"],
)


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
    response_model=list[TourResponse],
)
def get_tours(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Tour).order_by(
            Tour.id.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# GET SINGLE
# ============================================================

@router.get(
    "/{tour_id}",
    response_model=TourResponse,
)
def get_tour(
    tour_id: int,
    db: Session = Depends(get_db),
):
    tour = db.get(
        Tour,
        tour_id,
    )

    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )

    return tour


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=TourResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tour(
    data: TourCreate,
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

    existing_slug = (
        db.query(Tour)
        .filter(
            Tour.slug == data.slug
        )
        .first()
    )

    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tour with this slug already exists",
        )

    tour = Tour(
        title=data.title,
        slug=data.slug,
        description=data.description,

        category_id=data.category_id,
        region_id=data.region_id,

        district=data.district,
        meeting_point=data.meeting_point,

        latitude=data.latitude,
        longitude=data.longitude,

        price=data.price,
        duration=data.duration,

        start_date=data.start_date,
        end_date=data.end_date,

        maximum_people=data.maximum_people,
        available_seats=data.maximum_people,

        transport=data.transport,
        accommodation=data.accommodation,

        included=data.included,
        excluded=data.excluded,
        requirements=data.requirements,

        images=data.images,

        status="pending",

        organizer_profile_id=profile.id,
    )

    db.add(tour)
    db.commit()
    db.refresh(tour)

    return tour


# ============================================================
# UPDATE
#
# NO ACTIVE BOOKING:
#   direct edit
#
# ACTIVE BOOKING:
#   approved unused edit request required
# ============================================================

@router.patch(
    "/{tour_id}",
    response_model=TourResponse,
)
def update_tour(
    tour_id: int,
    data: TourUpdate,
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
            detail="You can only edit your own tours",
        )

    # --------------------------------------------------------
    # ACTIVE BOOKING CHECK
    # --------------------------------------------------------

    active_booking = (
        db.query(Booking)
        .filter(
            Booking.tour_id
            == tour.id,

            Booking.status.in_(
                [
                    BookingStatus.PENDING,
                    BookingStatus.APPROVED,
                ]
            ),
        )
        .first()
    )

    approved_request = None

    if active_booking:
        approved_request = (
            db.query(TourEditRequest)
            .filter(
                TourEditRequest.tour_id
                == tour.id,

                TourEditRequest.organizer_profile_id
                == profile.id,

                TourEditRequest.status
                == "approved",

                TourEditRequest.used_at.is_(
                    None
                ),
            )
            .order_by(
                TourEditRequest.id.desc()
            )
            .first()
        )

        if not approved_request:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This tour has active bookings. "
                    "Admin approval is required before editing."
                ),
            )

    # --------------------------------------------------------
    # DATA
    # --------------------------------------------------------

    update_data = (
        data.model_dump(
            exclude_unset=True
        )
    )

    # --------------------------------------------------------
    # SLUG UNIQUE
    # --------------------------------------------------------

    if "slug" in update_data:
        existing_slug = (
            db.query(Tour)
            .filter(
                Tour.slug
                == update_data[
                    "slug"
                ],

                Tour.id != tour.id,
            )
            .first()
        )

        if existing_slug:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tour with this slug already exists",
            )

    # --------------------------------------------------------
    # MAX PEOPLE
    # --------------------------------------------------------

    if (
        "maximum_people"
        in update_data
    ):
        new_maximum = (
            update_data[
                "maximum_people"
            ]
        )

        booked_seats = (
            tour.maximum_people
            - tour.available_seats
        )

        if (
            new_maximum
            < booked_seats
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Maximum people cannot be smaller "
                    "than already booked seats"
                ),
            )

        tour.available_seats = (
            new_maximum
            - booked_seats
        )

    # --------------------------------------------------------
    # APPLY UPDATE
    # --------------------------------------------------------

    for field, value in (
        update_data.items()
    ):
        setattr(
            tour,
            field,
            value,
        )

    # Every edit requires admin re-approval
    tour.status = "pending"

    # Approved permission can only be used once
    if approved_request:
        approved_request.status = (
            "used"
        )

        approved_request.used_at = (
            datetime.now(
                timezone.utc
            )
        )

    db.commit()
    db.refresh(tour)

    return tour


# ============================================================
# ADMIN STATUS
# ============================================================

@router.patch(
    "/{tour_id}/status",
    response_model=TourResponse,
)
def update_tour_status(
    tour_id: int,
    data: TourStatusUpdate,
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    tour = db.get(
        Tour,
        tour_id,
    )

    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )

    tour.status = data.status

    db.commit()
    db.refresh(tour)

    return tour


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{tour_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_tour(
    tour_id: int,
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    tour = db.get(
        Tour,
        tour_id,
    )

    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )

    booking = (
        db.query(Booking)
        .filter(
            Booking.tour_id
            == tour.id
        )
        .first()
    )

    if booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Tour cannot be deleted because "
                "it already has bookings"
            ),
        )

    db.delete(tour)
    db.commit()

    return None