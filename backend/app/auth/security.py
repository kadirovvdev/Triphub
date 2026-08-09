import hashlib
import hmac
import secrets

from datetime import (
    datetime,
    timedelta,
    timezone,
)

from fastapi import (
    HTTPException,
    status,
)

from jose import (
    JWTError,
    jwt,
)

from passlib.context import CryptContext
from pydantic_settings import BaseSettings


# ============================================================
# SETTINGS
# ============================================================


class SecuritySettings(BaseSettings):
    JWT_SECRET_KEY: str

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = (
        60 * 24
    )

    PASSWORD_RESET_EXPIRE_MINUTES: int = 20

    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 10

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = SecuritySettings()


SECRET_KEY = settings.JWT_SECRET_KEY

ALGORITHM = settings.JWT_ALGORITHM

ACCESS_TOKEN_EXPIRE_MINUTES = (
    settings.ACCESS_TOKEN_EXPIRE_MINUTES
)

PASSWORD_RESET_EXPIRE_MINUTES = (
    settings.PASSWORD_RESET_EXPIRE_MINUTES
)

EMAIL_VERIFICATION_EXPIRE_MINUTES = (
    settings.EMAIL_VERIFICATION_EXPIRE_MINUTES
)


# ============================================================
# PASSWORD HASHING
# ============================================================


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(
    password: str,
) -> str:
    password_bytes = password.encode(
        "utf-8"
    )

    if len(password_bytes) > 72:
        raise ValueError(
            "Password must be 72 bytes or less"
        )

    return pwd_context.hash(
        password
    )


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    password_bytes = password.encode(
        "utf-8"
    )

    if len(password_bytes) > 72:
        return False

    try:
        return pwd_context.verify(
            password,
            password_hash,
        )

    except Exception:
        return False


# ============================================================
# ACCESS TOKEN
# ============================================================


def create_access_token(
    user_id: int,
) -> str:
    now = datetime.now(
        timezone.utc
    )

    expire = (
        now
        + timedelta(
            minutes=(
                ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> int:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ],
        )

        user_id = payload.get(
            "sub"
        )

        token_type = payload.get(
            "type"
        )

        if (
            user_id is None
            or token_type != "access"
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_401_UNAUTHORIZED
                ),
                detail=(
                    "Invalid authentication token"
                ),
            )

        return int(
            user_id
        )

    except HTTPException:
        raise

    except (
        JWTError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid authentication token"
            ),
        )


# ============================================================
# PASSWORD RESET TOKEN
# ============================================================


def create_password_reset_token(
    user_id: int,
) -> str:
    now = datetime.now(
        timezone.utc
    )

    expire = (
        now
        + timedelta(
            minutes=(
                PASSWORD_RESET_EXPIRE_MINUTES
            )
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "reset",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_password_reset_token(
    token: str,
) -> int:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ],
        )

        user_id = payload.get(
            "sub"
        )

        token_type = payload.get(
            "type"
        )

        if (
            user_id is None
            or token_type != "reset"
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Invalid or expired reset token"
                ),
            )

        return int(
            user_id
        )

    except HTTPException:
        raise

    except (
        JWTError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid or expired reset token"
            ),
        )


# ============================================================
# EMAIL VERIFICATION
# ============================================================


def generate_verification_code() -> str:
    return (
        f"{secrets.randbelow(1_000_000):06d}"
    )


def hash_verification_code(
    code: str,
) -> str:
    return hmac.new(
        SECRET_KEY.encode(
            "utf-8"
        ),
        code.encode(
            "utf-8"
        ),
        hashlib.sha256,
    ).hexdigest()


def verify_verification_code(
    code: str,
    code_hash: str,
) -> bool:
    calculated_hash = (
        hash_verification_code(
            code
        )
    )

    return hmac.compare_digest(
        calculated_hash,
        code_hash,
    )


def verification_expiry():
    return (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=(
                EMAIL_VERIFICATION_EXPIRE_MINUTES
            )
        )
    )