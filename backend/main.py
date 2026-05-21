import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, projects, tasks, dashboard, attendance

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow API",
    description="Team Task Management REST API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],             # Allow any frontend URL to connect
    allow_credentials=False,         # Not needed since we use JWT Bearer tokens, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(projects.router,  prefix="/api/projects",  tags=["Projects"])
app.include_router(tasks.router,     prefix="/api/tasks",     tags=["Tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])

@app.get("/", tags=["Health"])
def root():
    return {"message": "TaskFlow API is running ✅", "docs": "/docs", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}