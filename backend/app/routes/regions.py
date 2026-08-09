from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.region import Region
from app.schemas.region import RegionCreate, RegionResponse


router = APIRouter(
    prefix="/regions",
    tags=["Regions"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "",
    response_model=list[RegionResponse],
)
def get_regions(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Region).order_by(Region.id)
    )

    return result.scalars().all()


@router.get(
    "/{region_id}",
    response_model=RegionResponse,
)
def get_region(
    region_id: int,
    db: Session = Depends(get_db),
):
    region = db.get(Region, region_id)

    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Region not found",
        )

    return region


@router.post(
    "",
    response_model=RegionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_region(
    data: RegionCreate,
    db: Session = Depends(get_db),
):
    existing = db.execute(
        select(Region).where(Region.slug == data.slug)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Region with this slug already exists",
        )

    region = Region(
        name=data.name,
        slug=data.slug,
    )

    db.add(region)
    db.commit()
    db.refresh(region)

    return region