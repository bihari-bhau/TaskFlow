from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth_utils import get_current_user

router = APIRouter()


def get_membership(db: Session, project_id: int, user_id: int) -> models.ProjectMember:
    member = db.query(models.ProjectMember).filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project"
        )
    return member


@router.get("/projects/{project_id}/tasks", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List tasks in a project.
    - Admins see ALL tasks.
    - Members see ONLY their assigned tasks.
    """
    membership = get_membership(db, project_id, current_user.id)
    query = db.query(models.Task).filter_by(project_id=project_id)

    if membership.role == models.RoleEnum.member:
        query = query.filter_by(assigned_to=current_user.id)

    return query.order_by(models.Task.created_at.desc()).all()


@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new task in a project. Admin only."""
    membership = get_membership(db, project_id, current_user.id)

    if membership.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project admins can create tasks"
        )

    # Validate assignee is a project member
    if payload.assigned_to:
        is_member = db.query(models.ProjectMember).filter_by(
            project_id=project_id, user_id=payload.assigned_to
        ).first()
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignee must be a member of the project"
            )

    task = models.Task(
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        priority=payload.priority,
        project_id=project_id,
        assigned_to=payload.assigned_to,
        created_by=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single task. Members can only view their assigned tasks."""
    task = db.query(models.Task).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    membership = get_membership(db, task.project_id, current_user.id)

    if membership.role == models.RoleEnum.member and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own assigned tasks"
        )
    return task


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update a task.
    - Admins can update all fields.
    - Members can ONLY update the status of their assigned tasks.
    """
    task = db.query(models.Task).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    membership = get_membership(db, task.project_id, current_user.id)
    is_admin = membership.role == models.RoleEnum.admin
    is_assignee = task.assigned_to == current_user.id

    if not is_admin and not is_assignee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tasks assigned to you"
        )

    # Members can only update status
    if not is_admin:
        non_status_fields = [payload.title, payload.description, payload.due_date, payload.priority, payload.assigned_to]
        if any(f is not None for f in non_status_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only update task status"
            )

    # Apply updates
    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.status is not None:
        task.status = payload.status
    if payload.assigned_to is not None:
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can reassign tasks"
            )
        # Validate new assignee is a project member
        is_member = db.query(models.ProjectMember).filter_by(
            project_id=task.project_id, user_id=payload.assigned_to
        ).first()
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignee must be a member of the project"
            )
        task.assigned_to = payload.assigned_to

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a task. Admin only."""
    task = db.query(models.Task).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    membership = get_membership(db, task.project_id, current_user.id)
    if membership.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project admins can delete tasks"
        )

    db.delete(task)
    db.commit()
