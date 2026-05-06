import enum

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class LeadSource(str, enum.Enum):
    website = "website"
    referral = "referral"
    linkedin = "linkedin"
    cold_call = "cold_call"
    event = "event"
    other = "other"


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    unqualified = "unqualified"


class Lead(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "leads"

    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    company: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    position: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, native_enum=False),
        default=LeadSource.website,
        nullable=False,
    )
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, native_enum=False),
        default=LeadStatus.new,
        nullable=False,
    )
    score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    assigned_to: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    last_activity_at: Mapped[str] = mapped_column(String(40), nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="leads")
