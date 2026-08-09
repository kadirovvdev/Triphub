import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI


ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Local test uchun backend/.env ni o'qiydi.
# Vercel'da Environment Variables ishlatiladi.
load_dotenv(BACKEND_DIR / ".env")

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


from app.main import app as backend_app


# ============================================================
# VERCEL-ONLY APP
# ============================================================

app = FastAPI(
    title="TripNet API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# Vercel:
# /api/tours -> backend /tours
# /api/auth/register -> backend /auth/register
app.mount("/api", backend_app)
