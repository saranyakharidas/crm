from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.task import TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    due_date: str | None = None
    priority: TaskPriority = TaskPriority.medium
    status: TaskStatus = TaskStatus.pending
    related_type: str | None = None
    related_id: str | None = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: str | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    related_type: str | None = None
    related_id: str | None = None

class TaskResponse(TaskBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
