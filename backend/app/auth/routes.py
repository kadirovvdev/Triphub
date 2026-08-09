from datetime import (
    datetime,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy.orm import Session

from app.auth.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
    VerifyEmailRequest,
)

from app.auth.security import (
    create_access_token,
    create_password_reset_token,
    decode_access_token,
    decode_password_reset_token,
    generate_verification_code,
    hash_password,
    hash_verification_code,
    verification_expiry,
    verify_password,
    verify_verification_code,
)

from app.database import SessionLocal

from app.models.user import (
    User,
    UserRole,
)

from app.services.email import (
    email_settings,
    send_password_reset_email,
    send_verification_email,
)


router = APIRouter(
    prefix="/auth",
    tags=[
        "Authentication"
    ],
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
# JWT
# ============================================================


security = HTTPBearer()


# ============================================================
# REGISTER
# ============================================================


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        str(
            data.email
        )
        .strip()
        .lower()
    )


    existing_user = (
        db.query(
            User
        )
        .filter(
            User.email
            == email
        )
        .first()
    )


    if existing_user:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Email already registered"
            ),
        )


    if data.role not in {
        "traveler",
        "organizer",
    }:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid role"
            ),
        )


    try:
        password_hash = (
            hash_password(
                data.password
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(
                exc
            ),
        )


    verification_code = (
        generate_verification_code()
    )


    user = User(
        email=email,

        password_hash=(
            password_hash
        ),

        role=UserRole(
            data.role
        ),

        phone=(
            data.phone
        ),

        bio=(
            data.bio
        ),

        avatar_url=(
            data.avatar_url
        ),

        email_verified=False,

        email_verification_code_hash=(
            hash_verification_code(
                verification_code
            )
        ),

        email_verification_expires_at=(
            verification_expiry()
        ),
    )


    db.add(
        user
    )

    db.commit()

    db.refresh(
        user
    )


    try:
        send_verification_email(
            email=user.email,
            code=verification_code,
        )

    except Exception as exc:
        print(
            "EMAIL SEND ERROR:",
            exc,
        )


    dev_code = (
        verification_code
        if (
            email_settings.EMAIL_MODE.lower()
            == "console"
        )
        else None
    )


    return {
        "message": (
            "Account created. "
            "Please verify your email."
        ),

        "email":
            user.email,

        "requires_verification":
            True,

        "dev_verification_code":
            dev_code,
    }


# ============================================================
# VERIFY EMAIL
# ============================================================


@router.post(
    "/verify-email",
    response_model=TokenResponse,
)
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        str(
            data.email
        )
        .strip()
        .lower()
    )


    user = (
        db.query(
            User
        )
        .filter(
            User.email
            == email
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid verification code"
            ),
        )


    if user.email_verified:
        access_token = (
            create_access_token(
                user.id
            )
        )

        return {
            "access_token":
                access_token,

            "token_type":
                "bearer",

            "user":
                user,
        }


    if (
        not user.email_verification_code_hash
        or
        not user.email_verification_expires_at
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Verification code not available. "
                "Request a new code."
            ),
        )


    expires_at = (
        user.email_verification_expires_at
    )


    if (
        expires_at.tzinfo
        is None
    ):
        expires_at = (
            expires_at.replace(
                tzinfo=timezone.utc
            )
        )


    if (
        datetime.now(
            timezone.utc
        )
        >
        expires_at
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Verification code expired"
            ),
        )


    if not verify_verification_code(
        data.code,
        user.email_verification_code_hash,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid verification code"
            ),
        )


    user.email_verified = (
        True
    )

    user.email_verification_code_hash = (
        None
    )

    user.email_verification_expires_at = (
        None
    )


    db.commit()

    db.refresh(
        user
    )


    access_token = (
        create_access_token(
            user.id
        )
    )


    return {
        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user":
            user,
    }


# ============================================================
# RESEND VERIFICATION
# ============================================================


@router.post(
    "/resend-verification",
    response_model=ResendVerificationResponse,
)
def resend_verification(
    data: ResendVerificationRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        str(
            data.email
        )
        .strip()
        .lower()
    )


    user = (
        db.query(
            User
        )
        .filter(
            User.email
            == email
        )
        .first()
    )


    generic_message = (
        "If the account requires verification, "
        "a new code has been sent."
    )


    if (
        not user
        or user.email_verified
    ):
        return {
            "message":
                generic_message,

            "dev_verification_code":
                None,
        }


    verification_code = (
        generate_verification_code()
    )


    user.email_verification_code_hash = (
        hash_verification_code(
            verification_code
        )
    )

    user.email_verification_expires_at = (
        verification_expiry()
    )


    db.commit()


    try:
        send_verification_email(
            email=user.email,
            code=verification_code,
        )

    except Exception as exc:
        print(
            "EMAIL SEND ERROR:",
            exc,
        )


    dev_code = (
        verification_code
        if (
            email_settings.EMAIL_MODE.lower()
            == "console"
        )
        else None
    )


    return {
        "message":
            generic_message,

        "dev_verification_code":
            dev_code,
    }


# ============================================================
# LOGIN
# ============================================================


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        str(
            data.email
        )
        .strip()
        .lower()
    )


    user = (
        db.query(
            User
        )
        .filter(
            User.email
            == email
        )
        .first()
    )


    if (
        not user
        or not verify_password(
            data.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid email or password"
            ),
        )


    if (
        not user.email_verified
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Email verification required"
            ),
        )


    access_token = (
        create_access_token(
            user.id
        )
    )


    return {
        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user":
            user,
    }


# ============================================================
# CURRENT USER
# ============================================================


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(
        get_db
    ),
):
    token = (
        credentials.credentials
    )


    user_id = (
        decode_access_token(
            token
        )
    )


    user = (
        db.query(
            User
        )
        .filter(
            User.id
            == user_id
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "User not found"
            ),
        )


    return user


# ============================================================
# ADMIN
# ============================================================


def get_current_admin_user(
    current_user: User = Depends(
        get_current_user
    ),
):
    if (
        current_user.role
        != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Admin access required"
            ),
        )

    return current_user


# ============================================================
# ORGANIZER
# ============================================================


def get_current_organizer_user(
    current_user: User = Depends(
        get_current_user
    ),
):
    if (
        current_user.role
        != UserRole.ORGANIZER
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Organizer access required"
            ),
        )

    return current_user


# ============================================================
# TRAVELER
# ============================================================


def get_current_traveler_user(
    current_user: User = Depends(
        get_current_user
    ),
):
    if (
        current_user.role
        != UserRole.TRAVELER
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Traveler access required"
            ),
        )

    return current_user


# ============================================================
# GET ME
# ============================================================


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user


# ============================================================
# UPDATE ME
# ============================================================


@router.patch(
    "/me",
    response_model=UserResponse,
)
def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):
    update_data = (
        data.model_dump(
            exclude_unset=True
        )
    )


    for (
        field,
        value
    ) in update_data.items():
        setattr(
            current_user,
            field,
            value,
        )


    db.commit()

    db.refresh(
        current_user
    )


    return current_user


# ============================================================
# FORGOT PASSWORD
# ============================================================


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        str(
            data.email
        )
        .strip()
        .lower()
    )


    user = (
        db.query(
            User
        )
        .filter(
            User.email
            == email
        )
        .first()
    )


    message = (
        "If an account exists with that email, "
        "password reset instructions have been sent."
    )


    if not user:
        return {
            "message":
                message,

            "reset_token":
                None,
        }


    reset_token = (
        create_password_reset_token(
            user.id
        )
    )


    try:
        send_password_reset_email(
            email=user.email,
            reset_token=reset_token,
        )

    except Exception as exc:
        print(
            "PASSWORD RESET EMAIL ERROR:",
            exc,
        )


    dev_token = (
        reset_token
        if (
            email_settings.EMAIL_MODE.lower()
            == "console"
        )
        else None
    )


    return {
        "message":
            message,

        "reset_token":
            dev_token,
    }


# ============================================================
# RESET PASSWORD
# ============================================================


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(
        get_db
    ),
):
    user_id = (
        decode_password_reset_token(
            data.token
        )
    )


    user = (
        db.query(
            User
        )
        .filter(
            User.id
            == user_id
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid or expired reset token"
            ),
        )


    try:
        user.password_hash = (
            hash_password(
                data.new_password
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(
                exc
            ),
        )


    db.commit()


    return {
        "message": (
            "Password reset successfully"
        )
    }