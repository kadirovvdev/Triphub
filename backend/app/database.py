from sqlalchemy import (
    create_engine,
    text,
)

from sqlalchemy.orm import (
    sessionmaker,
)

from pydantic_settings import (
    BaseSettings,
)


class Settings(BaseSettings):
    DATABASE_URL: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT 1"
            )
        )

        return (
            result.scalar()
            == 1
        )


from app.models import user
from app.models import category
from app.models import region
from app.models import tour
from app.models import organizer_profile
from app.models import booking