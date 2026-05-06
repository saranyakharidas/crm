from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.recurring_task import RecurringTask, SpawnedTask, RecurrenceStatus
from app.models.user import User
from app.schemas.recurring_task import RecurringTaskCreate, RecurringTaskResponse, RecurringTaskUpdate
from datetime import datetime

router = APIRouter(prefix="/recurring-tasks", tags=["recurring-tasks"])

@router.get("", response_model=List[RecurringTaskResponse])
def get_recurring_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.scalars(
        select(RecurringTask)
        .where(RecurringTask.owner_id == current_user.id)
        .order_by(RecurringTask.created_at.desc())
    ).all()

@router.post("", response_model=RecurringTaskResponse)
def create_recurring_task(
    task_in: RecurringTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    task = RecurringTask(
        **task_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/{task_id}", response_model=RecurringTaskResponse)
def update_recurring_task(
    task_id: str,
    task_in: RecurringTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    task = db.get(RecurringTask, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    task = db.get(RecurringTask, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return None

@router.post("/{task_id}/run")
def run_recurring_task_now(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    task = db.get(RecurringTask, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Spawn a task
    spawn = SpawnedTask(
        recurring_task_id=task_id,
        title=task.title,
        due_date=datetime.utcnow(), # simplified
        status="todo",
    )
    task.occurrence_count += 1
    task.last_run_at = datetime.utcnow()
    
    db.add(spawn)
    db.add(task)
    db.commit()
    return {"status": "ok", "spawn_id": spawn.id}

@router.post("/spawned/{spawn_id}/complete")
def complete_spawned_task(
    spawn_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    spawn = db.get(SpawnedTask, spawn_id)
    if not spawn:
        raise HTTPException(status_code=404, detail="Spawned task not found")
    
    spawn.status = "completed"
    spawn.completed_at = datetime.utcnow()
    db.add(spawn)
    db.commit()
    return {"status": "ok"}
