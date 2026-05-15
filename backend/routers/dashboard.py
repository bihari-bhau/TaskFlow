from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from database import get_db
import models
import schemas
from auth_utils import get_current_user

router = APIRouter()


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Aggregated dashboard stats for all projects the current user belongs to.
    Returns: total counts, tasks by status, tasks per user, overdue count, completion rate.
    """
    # Get all project IDs user belongs to
    memberships = db.query(models.ProjectMember).filter_by(user_id=current_user.id).all()
    project_ids = [m.project_id for m in memberships]

    if not project_ids:
        return schemas.DashboardOut(
            total_projects=0,
            total_tasks=0,
            my_tasks=0,
            overdue_tasks=0,
            tasks_by_status=schemas.TasksByStatus(todo=0, in_progress=0, done=0),
            tasks_per_user=[],
            completion_rate=0.0
        )

    all_tasks = db.query(models.Task).filter(
        models.Task.project_id.in_(project_ids)
    ).all()

    now = datetime.now(timezone.utc)

    # Compute stats
    status_counts = {"todo": 0, "in_progress": 0, "done": 0}
    overdue_count = 0
    my_task_count = 0
    user_task_map: dict = {}

    for task in all_tasks:
        status_counts[task.status.value] += 1

        if task.due_date:
            due = task.due_date
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
            if due < now and task.status != models.StatusEnum.done:
                overdue_count += 1

        if task.assigned_to == current_user.id:
            my_task_count += 1

        if task.assigned_to:
            if task.assigned_to not in user_task_map:
                assignee = db.query(models.User).filter_by(id=task.assigned_to).first()
                if assignee:
                    user_task_map[task.assigned_to] = {
                        "user_id": assignee.id,
                        "name": assignee.name,
                        "email": assignee.email,
                        "count": 0
                    }
            if task.assigned_to in user_task_map:
                user_task_map[task.assigned_to]["count"] += 1

    total = len(all_tasks)
    completion_rate = round((status_counts["done"] / total) * 100, 1) if total > 0 else 0.0

    return schemas.DashboardOut(
        total_projects=len(project_ids),
        total_tasks=total,
        my_tasks=my_task_count,
        overdue_tasks=overdue_count,
        tasks_by_status=schemas.TasksByStatus(**status_counts),
        tasks_per_user=[schemas.UserTaskCount(**v) for v in user_task_map.values()],
        completion_rate=completion_rate
    )
