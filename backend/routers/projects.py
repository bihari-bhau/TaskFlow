from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth_utils import get_current_user

router = APIRouter()


def get_member_or_404(db: Session, project_id: int, user_id: int) -> models.ProjectMember:
    member = db.query(models.ProjectMember).filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project"
        )
    return member


def require_admin(db: Session, project_id: int, user_id: int):
    member = get_member_or_404(db, project_id, user_id)
    if member.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project admins can perform this action"
        )
    return member


@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new project. The creator automatically becomes Admin."""
    project = models.Project(
        name=payload.name,
        description=payload.description,
        created_by=current_user.id
    )
    db.add(project)
    db.flush()  # get the project.id

    # Creator becomes Admin automatically
    membership = models.ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=models.RoleEnum.admin
    )
    db.add(membership)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all projects the current user is a member of."""
    memberships = db.query(models.ProjectMember).filter_by(user_id=current_user.id).all()
    project_ids = [m.project_id for m in memberships]
    return db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a project's details including all members."""
    get_member_or_404(db, project_id, current_user.id)
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update project name or description. Admin only."""
    require_admin(db, project_id, current_user.id)
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name.strip()
    if payload.description is not None:
        project.description = payload.description

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a project and all its tasks. Admin only."""
    require_admin(db, project_id, current_user.id)
    project = db.query(models.Project).filter_by(id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=schemas.ProjectOut)
def add_member(
    project_id: int,
    payload: schemas.AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a user to the project by email. Admin only."""
    require_admin(db, project_id, current_user.id)

    target_user = db.query(models.User).filter_by(email=payload.email).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found with email: {payload.email}"
        )

    existing = db.query(models.ProjectMember).filter_by(
        project_id=project_id, user_id=target_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user is already a member of the project"
        )

    db.add(models.ProjectMember(
        project_id=project_id,
        user_id=target_user.id,
        role=payload.role
    ))
    db.commit()
    return db.query(models.Project).filter_by(id=project_id).first()


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a member from the project. Admin only. Cannot remove yourself."""
    require_admin(db, project_id, current_user.id)

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the project"
        )

    member = db.query(models.ProjectMember).filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this project")

    db.delete(member)
    db.commit()
