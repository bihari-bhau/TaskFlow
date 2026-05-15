import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, projects, tasks, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow API",
    description="Team Task Management REST API",
    version="1.0.0"
)

# ── CORS ────────────────────────────────────────────────────────────────────
# In production, set ALLOWED_ORIGINS to your Railway frontend URL.
# Example: https://taskflow-frontend.up.railway.app
# Multiple origins → comma-separated: https://foo.app,https://bar.app
# Locally (no env var set) → allow everything for convenience.

_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")

if _raw_origins.strip() == "*":
    allow_origins     = ["*"]
    allow_credentials = False          # credentials=True is incompatible with wildcard
else:
    allow_origins     = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(projects.router,  prefix="/api/projects",  tags=["Projects"])
app.include_router(tasks.router,     prefix="/api/tasks",     tags=["Tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "TaskFlow API is running ✅",
        "docs":    "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}