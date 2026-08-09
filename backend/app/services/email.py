import smtplib

from email.message import EmailMessage

from pydantic_settings import BaseSettings


# ============================================================
# SETTINGS
# ============================================================


class EmailSettings(BaseSettings):
    EMAIL_MODE: str = "console"

    FRONTEND_URL: str = (
        "http://localhost:5173"
    )

    SMTP_HOST: str | None = None

    SMTP_PORT: int = 587

    SMTP_USERNAME: str | None = None

    SMTP_PASSWORD: str | None = None

    SMTP_FROM_EMAIL: str | None = None

    SMTP_FROM_NAME: str = (
        "TripHub Uzbekistan"
    )

    SMTP_USE_TLS: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


email_settings = EmailSettings()


# ============================================================
# SMTP
# ============================================================


def _send_smtp_email(
    to_email: str,
    subject: str,
    body: str,
):
    if not email_settings.SMTP_HOST:
        raise RuntimeError(
            "SMTP_HOST is not configured"
        )

    if not email_settings.SMTP_FROM_EMAIL:
        raise RuntimeError(
            "SMTP_FROM_EMAIL is not configured"
        )

    message = EmailMessage()

    message[
        "Subject"
    ] = subject

    message[
        "From"
    ] = (
        f"{email_settings.SMTP_FROM_NAME} "
        f"<{email_settings.SMTP_FROM_EMAIL}>"
    )

    message[
        "To"
    ] = to_email

    message.set_content(
        body
    )


    if (
        email_settings.SMTP_PORT
        == 465
    ):
        with smtplib.SMTP_SSL(
            email_settings.SMTP_HOST,
            email_settings.SMTP_PORT,
            timeout=20,
        ) as server:

            if (
                email_settings.SMTP_USERNAME
                and
                email_settings.SMTP_PASSWORD
            ):
                server.login(
                    email_settings.SMTP_USERNAME,
                    email_settings.SMTP_PASSWORD,
                )

            server.send_message(
                message
            )

        return


    with smtplib.SMTP(
        email_settings.SMTP_HOST,
        email_settings.SMTP_PORT,
        timeout=20,
    ) as server:

        server.ehlo()

        if (
            email_settings.SMTP_USE_TLS
        ):
            server.starttls()

            server.ehlo()

        if (
            email_settings.SMTP_USERNAME
            and
            email_settings.SMTP_PASSWORD
        ):
            server.login(
                email_settings.SMTP_USERNAME,
                email_settings.SMTP_PASSWORD,
            )

        server.send_message(
            message
        )


# ============================================================
# GENERIC SEND
# ============================================================


def send_email(
    to_email: str,
    subject: str,
    body: str,
):
    if (
        email_settings.EMAIL_MODE.lower()
        == "console"
    ):
        print("")
        print("=" * 70)
        print("TRIPHUB EMAIL")
        print("=" * 70)
        print(
            f"TO: {to_email}"
        )
        print(
            f"SUBJECT: {subject}"
        )
        print("-" * 70)
        print(
            body
        )
        print("=" * 70)
        print("")

        return

    _send_smtp_email(
        to_email=to_email,
        subject=subject,
        body=body,
    )


# ============================================================
# EMAIL VERIFICATION
# ============================================================


def send_verification_email(
    email: str,
    code: str,
):
    body = f"""
Welcome to TripHub Uzbekistan!

Your email verification code is:

{code}

This code expires in 10 minutes.

If you did not create a TripHub account, you can ignore this email.

TripHub Uzbekistan
""".strip()

    send_email(
        to_email=email,
        subject=(
            "Verify your TripHub email"
        ),
        body=body,
    )


# ============================================================
# PASSWORD RESET
# ============================================================


def send_password_reset_email(
    email: str,
    reset_token: str,
):
    reset_url = (
        f"{email_settings.FRONTEND_URL}"
        f"/reset-password"
        f"?token={reset_token}"
    )

    body = f"""
You requested a password reset for your TripHub account.

Open this link to create a new password:

{reset_url}

This link expires soon.

If you did not request a password reset, ignore this email.

TripHub Uzbekistan
""".strip()

    send_email(
        to_email=email,
        subject=(
            "Reset your TripHub password"
        ),
        body=body,
    )