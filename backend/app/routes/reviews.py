from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.routes import get_current_user
from app.database import SessionLocal

from app.models.booking import (
    Booking,
    BookingStatus,
)
from app.models.organizer_profile import OrganizerProfile
from app.models.review import Review
from app.models.tour import Tour
from app.models.user import (
    User,
    UserRole,
)

from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
)


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
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
# RATING RECALCULATION
# ============================================================


def recalculate_tour_rating(
    db: Session,
    tour_id: int,
):
    tour = db.get(
        Tour,
        tour_id,
    )

    if not tour:
        return


    result = (
        db.query(
            func.avg(
                Review.rating
            ),
            func.count(
                Review.id
            ),
        )
        .filter(
            Review.tour_id
            == tour_id
        )
        .first()
    )


    average_rating = (
        float(
            result[0]
        )
        if result
        and result[0] is not None
        else 0.0
    )

    reviews_count = (
        int(
            result[1]
        )
        if result
        and result[1] is not None
        else 0
    )


    tour.rating = round(
        average_rating,
        2,
    )

    tour.reviews_count = (
        reviews_count
    )


# ============================================================
# ORGANIZER RATING
# ============================================================


def recalculate_organizer_rating(
    db: Session,
    organizer_profile_id: int | None,
):
    if not organizer_profile_id:
        return


    organizer = db.get(
        OrganizerProfile,
        organizer_profile_id,
    )

    if not organizer:
        return


    result = (
        db.query(
            func.avg(
                Review.rating
            ),
            func.count(
                Review.id
            ),
        )
        .filter(
            Review.organizer_profile_id
            == organizer_profile_id
        )
        .first()
    )


    average_rating = (
        float(
            result[0]
        )
        if result
        and result[0] is not None
        else 0.0
    )

    reviews_count = (
        int(
            result[1]
        )
        if result
        and result[1] is not None
        else 0
    )


    organizer.rating = round(
        average_rating,
        2,
    )

    organizer.reviews_count = (
        reviews_count
    )


# ============================================================
# PUBLIC: GET REVIEWS FOR ONE TOUR
# ============================================================


@router.get(
    "/tour/{tour_id}",
    response_model=list[ReviewResponse],
)
def get_tour_reviews(
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


    reviews = (
        db.query(
            Review
        )
        .filter(
            Review.tour_id
            == tour_id
        )
        .order_by(
            Review.id.desc()
        )
        .all()
    )


    return reviews


# ============================================================
# TRAVELER: GET MY REVIEWS
# ============================================================


@router.get(
    "/me",
    response_model=list[ReviewResponse],
)
def get_my_reviews(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):
    if (
        current_user.role
        != UserRole.TRAVELER
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can view their reviews",
        )


    reviews = (
        db.query(
            Review
        )
        .filter(
            Review.traveler_id
            == current_user.id
        )
        .order_by(
            Review.id.desc()
        )
        .all()
    )


    return reviews


# ============================================================
# ORGANIZER: GET REVIEWS FOR MY TOURS
# ============================================================


@router.get(
    "/organizer",
    response_model=list[ReviewResponse],
)
def get_organizer_reviews(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):
    if (
        current_user.role
        != UserRole.ORGANIZER
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view organizer reviews",
        )


    organizer_profile = (
        db.query(
            OrganizerProfile
        )
        .filter(
            OrganizerProfile.user_id
            == current_user.id
        )
        .first()
    )


    if not organizer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )


    reviews = (
        db.query(
            Review
        )
        .filter(
            Review.organizer_profile_id
            == organizer_profile.id
        )
        .order_by(
            Review.id.desc()
        )
        .all()
    )


    return reviews


# ============================================================
# CREATE REVIEW
# ============================================================


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):
    # --------------------------------------------------------
    # 1. Faqat traveler
    # --------------------------------------------------------

    if (
        current_user.role
        != UserRole.TRAVELER
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can create reviews",
        )


    # --------------------------------------------------------
    # 2. Tour mavjudmi?
    # --------------------------------------------------------

    tour = db.get(
        Tour,
        data.tour_id,
    )


    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )


    # --------------------------------------------------------
    # 3. Faqat approved tour
    # --------------------------------------------------------

    if tour.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviews can only be added to approved tours",
        )


    # --------------------------------------------------------
    # 4. Travelerda approved booking bo'lishi shart
    # --------------------------------------------------------

    approved_booking = (
        db.query(
            Booking
        )
        .filter(
            Booking.traveler_id
            == current_user.id,

            Booking.tour_id
            == data.tour_id,

            Booking.status
            == BookingStatus.APPROVED,
        )
        .first()
    )


    if not approved_booking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You need an approved booking for this tour before leaving a review",
        )


    # --------------------------------------------------------
    # 5. Bitta traveler bitta tourga bitta review
    # --------------------------------------------------------

    existing_review = (
        db.query(
            Review
        )
        .filter(
            Review.traveler_id
            == current_user.id,

            Review.tour_id
            == data.tour_id,
        )
        .first()
    )


    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this tour",
        )


    # --------------------------------------------------------
    # 6. Comment
    # --------------------------------------------------------

    comment = (
        data.comment
        .strip()
    )


    if len(comment) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Review comment must be at least 3 characters",
        )


    # --------------------------------------------------------
    # 7. Traveler display name
    #
    # User modelda full_name yo'q.
    # Bookingda esa full_name mavjud.
    # --------------------------------------------------------

    traveler_name = (
        approved_booking.full_name
        or current_user.email
    )


    # --------------------------------------------------------
    # 8. Review yaratish
    # --------------------------------------------------------

    review = Review(
        traveler_id=current_user.id,

        tour_id=tour.id,

        organizer_profile_id=(
            tour.organizer_profile_id
        ),

        rating=data.rating,

        comment=comment,

        traveler_name=traveler_name,

        traveler_avatar_url=(
            current_user.avatar_url
        ),
    )


    db.add(
        review
    )


    try:
        db.flush()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this tour",
        )


    # --------------------------------------------------------
    # 9. Tour rating
    # --------------------------------------------------------

    recalculate_tour_rating(
        db,
        tour.id,
    )


    # --------------------------------------------------------
    # 10. Organizer rating
    # --------------------------------------------------------

    recalculate_organizer_rating(
        db,
        tour.organizer_profile_id,
    )


    db.commit()

    db.refresh(
        review
    )


    return review


# ============================================================
# DELETE MY REVIEW
# ============================================================


@router.delete(
    "/{review_id}",
)
def delete_review(
    review_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):
    # --------------------------------------------------------
    # 1. Faqat traveler
    # --------------------------------------------------------

    if (
        current_user.role
        != UserRole.TRAVELER
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can delete reviews",
        )


    # --------------------------------------------------------
    # 2. Reviewni topish
    # --------------------------------------------------------

    review = db.get(
        Review,
        review_id,
    )


    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )


    # --------------------------------------------------------
    # 3. Faqat o'z reviewini o'chirishi mumkin
    # --------------------------------------------------------

    if (
        review.traveler_id
        != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this review",
        )


    tour_id = (
        review.tour_id
    )

    organizer_profile_id = (
        review.organizer_profile_id
    )


    # --------------------------------------------------------
    # 4. O'chirish
    # --------------------------------------------------------

    db.delete(
        review
    )

    db.flush()


    # --------------------------------------------------------
    # 5. Ratinglarni qayta hisoblash
    # --------------------------------------------------------

    recalculate_tour_rating(
        db,
        tour_id,
    )


    recalculate_organizer_rating(
        db,
        organizer_profile_id,
    )


    db.commit()


    return {
        "message": (
            "Review deleted successfully"
        )
    }