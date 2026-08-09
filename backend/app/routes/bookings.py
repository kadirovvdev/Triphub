from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.routes import get_current_user
from app.database import SessionLocal
from app.models.booking import Booking, BookingStatus
from app.models.organizer_profile import OrganizerProfile
from app.models.tour import Tour
from app.models.user import User, UserRole
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingStatusUpdate,
)

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# CREATE BOOKING
# ============================================================

@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Faqat traveler booking yaratishi mumkin

    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can create bookings",
        )

    # 2. Tourni topish

    tour = db.get(Tour, data.tour_id)

    if not tour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour not found",
        )

    # 3. Faqat approved tourga booking qilish mumkin

    if tour.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This tour is not available for booking",
        )

    # 4. Yetarli joy borligini tekshirish

    if data.seats > tour.available_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {tour.available_seats} seats available",
        )

    # 5. Organizer profilini olish

    organizer_profile = None

    if tour.organizer_profile_id:
        organizer_profile = db.get(
            OrganizerProfile,
            tour.organizer_profile_id,
        )

    # 6. Narxni SERVER hisoblaydi

    total_price = tour.price * data.seats

    # 7. Booking yaratish

    booking = Booking(
        tour_id=tour.id,
        traveler_id=current_user.id,
        organizer_profile_id=(
            organizer_profile.id
            if organizer_profile
            else None
        ),
        seats=data.seats,
        full_name=data.full_name,
        phone=data.phone,
        note=data.note,
        status=BookingStatus.PENDING,
        total_price=total_price,
    )

    # 8. Joylarni kamaytirish

    tour.available_seats -= data.seats

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


# ============================================================
# GET MY BOOKINGS - TRAVELER
# ============================================================

@router.get(
    "",
    response_model=list[BookingResponse],
)
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can view their bookings",
        )

    bookings = (
        db.query(Booking)
        .filter(
            Booking.traveler_id == current_user.id
        )
        .order_by(Booking.id.desc())
        .all()
    )

    return bookings


# ============================================================
# GET ORGANIZER BOOKINGS
# ============================================================

@router.get(
    "/organizer",
    response_model=list[BookingResponse],
)
def get_organizer_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Faqat organizer

    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view organizer bookings",
        )

    # 2. Organizer profilini topish

    organizer_profile = (
        db.query(OrganizerProfile)
        .filter(
            OrganizerProfile.user_id == current_user.id
        )
        .first()
    )

    if not organizer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )

    # 3. Shu organizerga tegishli bookinglar

    bookings = (
        db.query(Booking)
        .filter(
            Booking.organizer_profile_id
            == organizer_profile.id
        )
        .order_by(Booking.id.desc())
        .all()
    )

    return bookings


# ============================================================
# UPDATE BOOKING STATUS - ORGANIZER
# ============================================================

@router.patch(
    "/{booking_id}/status",
    response_model=BookingResponse,
)
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Faqat organizer status o'zgartira oladi

    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update booking status",
        )

    # 2. Organizer profilini topish

    organizer_profile = (
        db.query(OrganizerProfile)
        .filter(
            OrganizerProfile.user_id == current_user.id
        )
        .first()
    )

    if not organizer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizer profile not found",
        )

    # 3. Bookingni topish

    booking = db.get(Booking, booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # 4. Booking aynan shu organizatorga tegishlimi?

    if booking.organizer_profile_id != organizer_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this booking",
        )

    # 5. Faqat PENDING bookingni approve/reject qilish

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending bookings can be approved or rejected",
        )

    # 6. Organizer faqat APPROVED yoki REJECTED qilishi mumkin

    if data.status not in {
        BookingStatus.APPROVED,
        BookingStatus.REJECTED,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organizer can only approve or reject bookings",
        )

    # 7. Agar REJECT bo'lsa joylarni qaytaramiz

    if data.status == BookingStatus.REJECTED:
        tour = db.get(Tour, booking.tour_id)

        if tour:
            tour.available_seats += booking.seats

    # 8. Statusni yangilash

    booking.status = data.status

    db.commit()
    db.refresh(booking)

    return booking


# ============================================================
# CANCEL BOOKING - TRAVELER
# ============================================================

@router.patch(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Faqat traveler cancel qila oladi

    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only travelers can cancel bookings",
        )

    # 2. Bookingni topish

    booking = db.get(Booking, booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # 3. Booking shu travelerniki ekanligini tekshirish

    if booking.traveler_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this booking",
        )

    # 4. Faqat PENDING yoki APPROVED bookingni cancel qilish

    if booking.status not in {
        BookingStatus.PENDING,
        BookingStatus.APPROVED,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking cannot be cancelled",
        )

    # 5. Tourni topish

    tour = db.get(Tour, booking.tour_id)

    # 6. Joyni qaytarish

    if tour:
        tour.available_seats += booking.seats

    # 7. Statusni CANCELLED qilish

    booking.status = BookingStatus.CANCELLED

    db.commit()
    db.refresh(booking)

    return booking
