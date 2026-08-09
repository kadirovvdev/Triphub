from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)


# ============================================================
# USER
# ============================================================


class UserResponse(BaseModel):
    id: int

    email: str

    role: str

    avatar_url: str | None = None

    phone: str | None = None

    bio: str | None = None

    email_verified: bool = False

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class UserUpdateRequest(BaseModel):
    avatar_url: str | None = None

    phone: str | None = None

    bio: str | None = None


# ============================================================
# REGISTER
# ============================================================


class RegisterRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=72,
    )

    role: str = "traveler"

    phone: str | None = None

    bio: str | None = None

    avatar_url: str | None = None


class RegisterResponse(BaseModel):
    message: str

    email: str

    requires_verification: bool

    dev_verification_code: str | None = None


# ============================================================
# EMAIL VERIFICATION
# ============================================================


class VerifyEmailRequest(BaseModel):
    email: EmailStr

    code: str = Field(
        min_length=6,
        max_length=6,
    )


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    message: str

    dev_verification_code: str | None = None


# ============================================================
# LOGIN
# ============================================================


class LoginRequest(BaseModel):
    email: EmailStr

    password: str


class TokenResponse(BaseModel):
    access_token: str

    token_type: str

    user: UserResponse


# ============================================================
# FORGOT PASSWORD
# ============================================================


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str

    reset_token: str | None = None


# ============================================================
# RESET PASSWORD
# ============================================================


class ResetPasswordRequest(BaseModel):
    token: str

    new_password: str = Field(
        min_length=6,
        max_length=72,
    )


class ResetPasswordResponse(BaseModel):
    message: str