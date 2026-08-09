import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI


# ============================================================
# PATHS
# ============================================================

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"


# ============================================================
# LOCAL ENVIRONMENT
# ============================================================

# Local testlarda backend/.env ishlatiladi.
# Vercel productionda Environment Variables ustun bo'ladi.
load_dotenv(BACKEND_DIR / ".env")


# ============================================================
# PYTHON PATH
# ============================================================

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# ============================================================
# BACKEND APP
# ============================================================

from app.main import app as backend_app  # noqa: E402


# ============================================================
# VERCEL APP
# ============================================================

app = FastAPI(
    title="TripNet Vercel API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


# Existing backend routes:
#
# /auth/login
# /tours
# /bookings
#
# Vercel production routes:
#
# /api/auth/login
# /api/tours
# /api/bookings

app.mount(
    "/api",
    backend_app,
)
