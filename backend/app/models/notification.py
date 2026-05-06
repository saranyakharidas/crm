import enum
from sqlalchemy import Enum, ForeignKey, String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

class NotificationType(str, enum.Enum):
    info = "info"
    success = "success"
    warning = "warning"
    error = "error"

class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, native_enum=False),
        default=NotificationType.info,
        nullable=False,
    )
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="notifications")
