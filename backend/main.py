import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import auth, projects, tasks, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow API",
    description="Team Task Management REST API",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
#
# WHY NOT allow_origins=["*"] + allow_credentials=True ?
# The CORS spec forbids it. Browsers will block every request with:
#   "The value of 'Access-Control-Allow-Origin' is '*'
#    but 'Access-Control-Allow-Credentials' is true."
#
# FIX: List origins explicitly so credentials can be included.
#
# Local dev  → ALLOWED_ORIGINS not set → defaults to localhost:3000
# Production → set ALLOWED_ORIGINS=https://yourapp.up.railway.app in Railway

_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,   # explicit list, never "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(projects.router,  prefix="/api/projects",  tags=["Projects"])
app.include_router(tasks.router,     prefix="/api/tasks",     tags=["Tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "TaskFlow API is running ✅", "docs": "/docs", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}