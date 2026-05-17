import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env when present (local development)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Prefer Railway's provided URL, fall back to generic DATABASE_URL, then to SQLite for dev
DATABASE_URL = os.getenv("RAILWAY_DATABASE_URL", os.getenv("DATABASE_URL", "sqlite:///./taskflow.db"))

# Some providers (postgres://) use the legacy scheme — SQLAlchemy prefers postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure SSL for managed Postgres providers when not explicitly set
# (works for Railway and other hosted Postgres providers)
if DATABASE_URL.startswith("postgresql://") and "sslmode" not in DATABASE_URL:
    if "?" in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
    else:
        DATABASE_URL += "?sslmode=require"

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# Connection pool settings (recommended for hosted PostgreSQL)
pool_kwargs = {}
if "sqlite" not in DATABASE_URL:
    pool_size = int(os.getenv("PG_POOL_SIZE", "5"))
    pool_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": pool_size,
        "max_overflow": 10,
    }

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **pool_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
