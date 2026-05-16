import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env when present (local development)
load_dotenv()

# Supabase provides a standard PostgreSQL connection string
# For local dev, falls back to SQLite (no setup needed)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./taskflow.db")

# Supabase / some providers use postgres:// — SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Supabase requires SSL — add sslmode=require if not already present
if "supabase" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    # Connection pool settings recommended for Supabase
    pool_pre_ping=True,       # Verify connection before using from pool
    pool_recycle=300,         # Recycle connections every 5 minutes
    pool_size=5,              # Max 5 persistent connections (Supabase free tier limit)
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
