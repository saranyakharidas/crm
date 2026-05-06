import enum
from typing import List, Optional
from sqlalchemy import Enum, ForeignKey, String, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from datetime import datetime

class WorkflowStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    draft = "draft"

class WorkflowModule(str, enum.Enum):
    leads = "leads"
    contacts = "contacts"
    deals = "deals"
    tasks = "tasks"
    tickets = "tickets"

class Workflow(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflows"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[WorkflowStatus] = mapped_column(
        Enum(WorkflowStatus, native_enum=False),
        default=WorkflowStatus.draft,
        nullable=False,
    )
    module: Mapped[WorkflowModule] = mapped_column(
        Enum(WorkflowModule, native_enum=False),
        nullable=False,
    )
    trigger: Mapped[dict] = mapped_column(JSON, nullable=False)
    conditions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    actions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    execution_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_executed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowExecution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflow_executions"

    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflows.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # success, failed, skipped
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    record_id: Mapped[str] = mapped_column(String(100), nullable=False)
    record_name: Mapped[str] = mapped_column(String(200), nullable=False)
    executed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    workflow = relationship("Workflow", back_populates="executions")

class AssignmentRule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "assignment_rules"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[WorkflowStatus] = mapped_column(
        Enum(WorkflowStatus, native_enum=False),
        default=WorkflowStatus.draft,
        nullable=False,
    )
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    match_all: Mapped[bool] = mapped_column(default=True, nullable=False)
    conditions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    actions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    run_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="assignment_rules")
