from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, date, timezone
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models import Attendance, AttendanceStatus, User
from auth_utils import get_current_user
import schemas

router = APIRouter()


# ── Pydantic schemas (inline — add to schemas.py if preferred) ───────────────

class AttendanceOut(BaseModel):
    id:             int
    user_id:        int
    date:           date
    status:         AttendanceStatus
    checked_in_at:  Optional[datetime]
    checked_out_at: Optional[datetime]
    notes:          Optional[str]
    created_at:     datetime
    user:           Optional[schemas.UserOut]

    model_config = {"from_attributes": True}


class CheckInRequest(BaseModel):
    notes: Optional[str] = None


class CheckOutRequest(BaseModel):
    notes: Optional[str] = None


# ── helpers ───────────────────────────────────────────────────────────────────

def today_utc() -> date:
    return datetime.now(timezone.utc).date()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_today_record(db: Session, user_id: int) -> Optional[Attendance]:
    return db.query(Attendance).filter(
        and_(Attendance.user_id == user_id, Attendance.date == today_utc())
    ).first()


def is_admin(db: Session, current_user: User) -> bool:
    """Simple check — admin is defined as having admin role in ANY project."""
    from models import ProjectMember, RoleEnum
    return db.query(ProjectMember).filter(
        and_(ProjectMember.user_id == current_user.id,
             ProjectMember.role == RoleEnum.admin)
    ).first() is not None


# ── Check In ──────────────────────────────────────────────────────────────────

@router.post("/checkin", response_model=AttendanceOut)
def check_in(
    payload: CheckInRequest = CheckInRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark attendance check-in for today. One check-in per day per user."""
    existing = get_today_record(db, current_user.id)

    if existing:
        if existing.checked_in_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already checked in today."
            )
        # Record exists but no check-in yet — update it
        existing.checked_in_at = now_utc()
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing

    now = now_utc()
    # Determine status based on check-in time (after 9:30 AM = late)
    check_in_hour   = now.hour
    check_in_minute = now.minute
    att_status = AttendanceStatus.present
    if check_in_hour > 9 or (check_in_hour == 9 and check_in_minute > 30):
        att_status = AttendanceStatus.late

    record = Attendance(
        user_id       = current_user.id,
        date          = today_utc(),
        status        = att_status,
        checked_in_at = now,
        notes         = payload.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── Check Out ─────────────────────────────────────────────────────────────────

@router.post("/checkout", response_model=AttendanceOut)
def check_out(
    payload: CheckOutRequest = CheckOutRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark check-out for today."""
    record = get_today_record(db, current_user.id)

    if not record or not record.checked_in_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You haven't checked in today yet."
        )
    if record.checked_out_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked out today."
        )

    record.checked_out_at = now_utc()
    if payload.notes:
        record.notes = payload.notes
    db.commit()
    db.refresh(record)
    return record


# ── Today's status ────────────────────────────────────────────────────────────

@router.get("/today", response_model=Optional[AttendanceOut])
def get_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's attendance record for today."""
    return get_today_record(db, current_user.id)


# ── My history ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=List[AttendanceOut])
def get_my_attendance(
    limit: int = Query(default=30, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's attendance history (last 30 days by default)."""
    return (
        db.query(Attendance)
        .filter(Attendance.user_id == current_user.id)
        .order_by(Attendance.date.desc())
        .limit(limit)
        .all()
    )


# ── Admin: all records ────────────────────────────────────────────────────────

@router.get("/all", response_model=List[AttendanceOut])
def get_all_attendance(
    filter_date: Optional[date] = Query(default=None, alias="date"),
    user_id: Optional[int]      = Query(default=None),
    limit: int                  = Query(default=50, le=200),
    db: Session                 = Depends(get_db),
    current_user: User          = Depends(get_current_user),
):
    """Admin only — get all attendance records, optionally filtered by date or user."""
    if not is_admin(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    query = db.query(Attendance)

    if filter_date:
        query = query.filter(Attendance.date == filter_date)
    if user_id:
        query = query.filter(Attendance.user_id == user_id)

    return (
        query
        .order_by(Attendance.date.desc(), Attendance.checked_in_at.asc())
        .limit(limit)
        .all()
    )


# ── Admin: mark absent for a user ─────────────────────────────────────────────

@router.post("/mark-absent/{user_id}", response_model=AttendanceOut)
def mark_absent(
    user_id: int,
    db: Session        = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin only — manually mark a user as absent for today."""
    if not is_admin(db, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = db.query(Attendance).filter(
        and_(Attendance.user_id == user_id, Attendance.date == today_utc())
    ).first()

    if existing:
        existing.status = AttendanceStatus.absent
        db.commit()
        db.refresh(existing)
        return existing

    record = Attendance(
        user_id = user_id,
        date    = today_utc(),
        status  = AttendanceStatus.absent,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
