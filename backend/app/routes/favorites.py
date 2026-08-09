from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.routes import get_current_user
from app.database import SessionLocal
from app.models.favorite import Favorite
from app.models.tour import Tour
from app.models.user import User, UserRole
from app.schemas.favorite import FavoriteResponse


router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# GET MY FAVORITES
# ============================================================


@router.get(
    "",
    response_model=list[FavoriteResponse],
)
def get_my_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can view favorites",
        )

    favorites = (
        db.query(Favorite)
        .filter(
            Favorite.traveler_id
            == current_user.id
        )
        .order_by(
            Favorite.id.desc()
        )
        .all()
    )

    return favorites


# ============================================================
# ADD FAVORITE
# ============================================================


@router.post(
    "/{tour_id}",
    response_model=FavoriteResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_favorite(
    tour_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Faqat traveler
    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can add favorites",
        )

    # Tour mavjudligini tekshirish
    tour = db.get(
        Tour,
        tour_id,
    )

    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )

    # Traveler faqat approved tourni favorite qila oladi
    if tour.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved tours can be added to favorites",
        )

    # Oldin favorite qilinganmi?
    existing = (
        db.query(Favorite)
        .filter(
            Favorite.traveler_id
            == current_user.id,
            Favorite.tour_id
            == tour_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tour is already in favorites",
        )

    favorite = Favorite(
        traveler_id=current_user.id,
        tour_id=tour_id,
    )

    db.add(favorite)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tour is already in favorites",
        )

    db.refresh(favorite)

    return favorite


# ============================================================
# REMOVE FAVORITE
# ============================================================


@router.delete(
    "/{tour_id}",
)
def remove_favorite(
    tour_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can remove favorites",
        )

    favorite = (
        db.query(Favorite)
        .filter(
            Favorite.traveler_id
            == current_user.id,
            Favorite.tour_id
            == tour_id,
        )
        .first()
    )

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )

    db.delete(favorite)
    db.commit()

    return {
        "message": "Favorite removed successfully"
    }