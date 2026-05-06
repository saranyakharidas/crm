import enum
from sqlalchemy import Enum, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

class ContactStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class Contact(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "contacts"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    company: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    position: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    last_contacted_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    status: Mapped[ContactStatus] = mapped_column(
        Enum(ContactStatus, native_enum=False),
        default=ContactStatus.active,
        nullable=False,
    )
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="contacts")
