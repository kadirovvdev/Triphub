from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.routes import get_current_admin_user
from app.database import SessionLocal

from app.models.booking import Booking
from app.models.tour_edit_request import TourEditRequest
from app.models.user import User

from app.schemas.admin import AdminUserResponse
from app.schemas.booking import BookingResponse

from app.schemas.tour_edit_request import (
    TourEditRequestResponse,
    TourEditRequestStatusUpdate,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# USERS
# ============================================================

@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def get_users(
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(User).order_by(
            User.id.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# BOOKINGS
# ============================================================

@router.get(
    "/bookings",
    response_model=list[BookingResponse],
)
def get_bookings(
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Booking).order_by(
            Booking.id.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# TOUR EDIT REQUESTS
# ============================================================

@router.get(
    "/tour-edit-requests",
    response_model=list[TourEditRequestResponse],
)
def get_tour_edit_requests(
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(TourEditRequest)
        .order_by(
            TourEditRequest.id.desc()
        )
        .all()
    )


# ============================================================
# APPROVE / REJECT TOUR EDIT REQUEST
# ============================================================

@router.patch(
    "/tour-edit-requests/{request_id}/status",
    response_model=TourEditRequestResponse,
)
def update_tour_edit_request_status(
    request_id: int,
    data: TourEditRequestStatusUpdate,
    current_admin: User = Depends(
        get_current_admin_user
    ),
    db: Session = Depends(get_db),
):
    edit_request = db.get(
        TourEditRequest,
        request_id,
    )

    if not edit_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edit request not found",
        )

    if (
        edit_request.status
        != "pending"
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only pending edit requests "
                "can be reviewed"
            ),
        )

    edit_request.status = (
        data.status
    )

    edit_request.reviewed_by = (
        current_admin.id
    )

    edit_request.reviewed_at = (
        datetime.now(
            timezone.utc
        )
    )

    db.commit()
    db.refresh(edit_request)

    return edit_request