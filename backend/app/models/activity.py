import enum
from typing import List, Optional
from sqlalchemy import Enum, ForeignKey, String, Text, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from datetime import datetime

class ActivityType(str, enum.Enum):
    call = "call"
    email = "email"
    meeting = "meeting"
    note = "note"
    task = "task"
    deal_stage = "deal_stage"
    deal_created = "deal_created"
    contact_created = "contact_created"
    document = "document"
    whatsapp = "whatsapp"

class Activity(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "activities"

    type: Mapped[ActivityType] = mapped_column(
        Enum(ActivityType, native_enum=False),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    outcome: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    contact_id: Mapped[Optional[str]] = mapped_column(ForeignKey("contacts.id"), nullable=True)
    deal_id: Mapped[Optional[str]] = mapped_column(ForeignKey("deals.id"), nullable=True)
    
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="activities")
    contact = relationship("Contact")
    deal = relationship("Deal")
