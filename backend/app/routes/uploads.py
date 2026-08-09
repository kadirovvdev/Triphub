from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.auth.routes import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"],
)


# ============================================================
# CONFIG
# ============================================================

UPLOAD_DIR = Path("uploads/images")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


MAX_FILE_SIZE = 5 * 1024 * 1024


# ============================================================
# UPLOAD IMAGE
# ============================================================

@router.post("/images")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # FILE TYPE
    # --------------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG and WEBP images are allowed",
        )

    # --------------------------------------------------------
    # READ FILE
    # --------------------------------------------------------

    content = await file.read()

    # --------------------------------------------------------
    # FILE SIZE
    # --------------------------------------------------------

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be smaller than 5 MB",
        )

    # --------------------------------------------------------
    # GENERATE SAFE FILE NAME
    # --------------------------------------------------------

    extension = ALLOWED_CONTENT_TYPES[
        file.content_type
    ]

    filename = (
        f"{uuid4().hex}"
        f"{extension}"
    )

    file_path = (
        UPLOAD_DIR /
        filename
    )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    file_path.write_bytes(content)

    # --------------------------------------------------------
    # PUBLIC URL
    # --------------------------------------------------------

    return {
        "file_url": (
            f"http://127.0.0.1:8000/"
            f"media/images/{filename}"
        )
    }