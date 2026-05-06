import enum
from typing import List, Optional
from sqlalchemy import Enum, ForeignKey, String, Float, JSON, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from datetime import datetime

class QuoteStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    viewed = "viewed"
    accepted = "accepted"
    declined = "declined"
    expired = "expired"

class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    viewed = "viewed"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"

class Quote(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quotes"

    number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[QuoteStatus] = mapped_column(
        Enum(QuoteStatus, native_enum=False),
        default=QuoteStatus.draft,
        nullable=False,
    )
    deal_id: Mapped[Optional[str]] = mapped_column(ForeignKey("deals.id"), nullable=True)
    account_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    line_items: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    terms: Mapped[str] = mapped_column(Text, default="", nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="quotes")
    deal = relationship("Deal")

class Invoice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "invoices"

    number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, native_enum=False),
        default=InvoiceStatus.draft,
        nullable=False,
    )
    quote_id: Mapped[Optional[str]] = mapped_column(ForeignKey("quotes.id"), nullable=True)
    deal_id: Mapped[Optional[str]] = mapped_column(ForeignKey("deals.id"), nullable=True)
    account_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    line_items: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    terms: Mapped[str] = mapped_column(Text, default="", nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="invoices")
    quote = relationship("Quote")
    deal = relationship("Deal")
