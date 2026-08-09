import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth.routes import (
    router as auth_router,
)

from app.routes.tours import (
    router as tours_router,
)

from app.routes.bookings import (
    router as bookings_router,
)

from app.routes.organizers import (
    router as organizers_router,
)

from app.routes.categories import (
    router as categories_router,
)

from app.routes.regions import (
    router as regions_router,
)

from app.routes.admin import (
    router as admin_router,
)

from app.routes.uploads import (
    router as uploads_router,
)

from app.routes.tour_edit_requests import (
    router as tour_edit_requests_router,
)

from app.routes.favorites import (
    router as favorites_router,
)

from app.routes.reviews import (
    router as reviews_router,
)


UPLOAD_ROOT = Path(
    "uploads"
)

if not os.getenv("VERCEL"):
    UPLOAD_ROOT.mkdir(
        parents=True,
        exist_ok=True,
    )


app = FastAPI(
    title="TripHub Uzbekistan API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# ============================================================
# ROUTERS
# ============================================================


app.include_router(
    auth_router
)


app.include_router(
    tours_router
)


app.include_router(
    bookings_router
)


app.include_router(
    organizers_router
)


app.include_router(
    categories_router
)


app.include_router(
    regions_router
)


app.include_router(
    admin_router
)


app.include_router(
    uploads_router
)


app.include_router(
    tour_edit_requests_router
)


app.include_router(
    favorites_router
)


app.include_router(
    reviews_router
)


# ============================================================
# MEDIA
# ============================================================


app.mount(
    "/media",

    StaticFiles(
        directory="uploads"
    ),

    name="media",
)


# ============================================================
# ROOT
# ============================================================


@app.get("/")
def root():
    return {
        "message": (
            "TripHub Uzbekistan API is running"
        )
    }