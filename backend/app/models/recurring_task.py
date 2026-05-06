import enum
from typing import List, Optional
from sqlalchemy import Enum, ForeignKey, String, Text, JSON, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from datetime import datetime

class RecurrenceFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"

class RecurrenceStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    draft = "draft"

class RecurringTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "recurring_tasks"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    assigned_to: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    frequency: Mapped[RecurrenceFrequency] = mapped_column(
        Enum(RecurrenceFrequency, native_enum=False),
        nullable=False,
    )
    interval: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    days_of_week: Mapped[list] = mapped_column(JSON, default=list, nullable=True)
    day_of_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    status: Mapped[RecurrenceStatus] = mapped_column(
        Enum(RecurrenceStatus, native_enum=False),
        default=RecurrenceStatus.active,
        nullable=False,
    )
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    max_occurrences: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    occurrence_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_run_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    estimated_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    related_to: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    related_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="recurring_tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])
    spawned_tasks = relationship("SpawnedTask", back_populates="recurring_task", cascade="all, delete-orphan")

class SpawnedTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "spawned_tasks"

    recurring_task_id: Mapped[str] = mapped_column(ForeignKey("recurring_tasks.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="todo", nullable=False) # todo, completed, skipped

    recurring_task = relationship("RecurringTask", back_populates="spawned_tasks")
