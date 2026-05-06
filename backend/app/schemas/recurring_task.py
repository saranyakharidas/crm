from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.models.recurring_task import RecurrenceFrequency, RecurrenceStatus

class SpawnedTaskSchema(BaseModel):
    id: str
    recurring_task_id: str
    title: str
    due_date: datetime
    completed_at: Optional[datetime] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecurringTaskBase(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    assigned_to: Optional[str] = None
    frequency: RecurrenceFrequency
    interval: int = 1
    days_of_week: List[int] = []
    day_of_month: Optional[int] = None
    status: RecurrenceStatus = RecurrenceStatus.active
    start_date: datetime
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = None
    estimated_minutes: Optional[int] = None
    tags: List[str] = []
    related_to: Optional[str] = None
    related_type: Optional[str] = None

class RecurringTaskCreate(RecurringTaskBase):
    next_run_at: datetime

class RecurringTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[RecurrenceStatus] = None
    next_run_at: Optional[datetime] = None

class RecurringTaskResponse(RecurringTaskBase):
    id: str
    owner_id: str
    occurrence_count: int
    next_run_at: datetime
    last_run_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    spawned_tasks: List[SpawnedTaskSchema] = []

    model_config = ConfigDict(from_attributes=True)
