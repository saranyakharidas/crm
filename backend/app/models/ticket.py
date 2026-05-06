import enum
from typing import List, Optional
from sqlalchemy import Enum, ForeignKey, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from datetime import datetime

class TicketStatus(str, enum.Enum):
    new = "new"
    open = "open"
    pending = "pending"
    resolved = "resolved"
    closed = "closed"

class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class TicketCategory(str, enum.Enum):
    technical = "technical"
    billing = "billing"
    feature_request = "feature_request"
    general = "general"

class Ticket(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tickets"

    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, native_enum=False),
        default=TicketStatus.new,
        nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, native_enum=False),
        default=TicketPriority.medium,
        nullable=False,
    )
    category: Mapped[TicketCategory] = mapped_column(
        Enum(TicketCategory, native_enum=False),
        default=TicketCategory.general,
        nullable=False,
    )
    contact_id: Mapped[Optional[str]] = mapped_column(ForeignKey("contacts.id"), nullable=True)
    account_id: Mapped[Optional[str]] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="tickets")
    assignee = relationship("User", foreign_keys=[assigned_to])
    contact = relationship("Contact")
    account = relationship("Account")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")

class TicketMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ticket_messages"

    ticket_id: Mapped[str] = mapped_column(ForeignKey("tickets.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(default=False)

    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("User")
