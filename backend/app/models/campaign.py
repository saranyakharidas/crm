import enum

from sqlalchemy import Enum, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class CampaignType(str, enum.Enum):
    email = "email"
    sms = "sms"
    social = "social"
    ads = "ads"
    event = "event"
    webinar = "webinar"


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"


class Campaign(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "campaigns"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    type: Mapped[CampaignType] = mapped_column(
        Enum(CampaignType, native_enum=False),
        default=CampaignType.email,
        nullable=False,
    )
    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus, native_enum=False),
        default=CampaignStatus.draft,
        nullable=False,
    )
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    target_segment: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    audience_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    start_date: Mapped[str] = mapped_column(String(40), nullable=False)
    end_date: Mapped[str | None] = mapped_column(String(40), nullable=True)
    scheduled_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    budget: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    spent: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    email_subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_preheader: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    delivered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    opened: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    clicked: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    converted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unsubscribed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bounced: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="campaigns")

    @property
    def email_content(self) -> dict[str, str] | None:
        if not any([self.email_subject, self.email_preheader, self.email_body]):
            return None
        return {
            "subject": self.email_subject or "",
            "preheader": self.email_preheader or "",
            "body": self.email_body or "",
        }

    @property
    def metrics(self) -> dict[str, int]:
        return {
            "sent": self.sent,
            "delivered": self.delivered,
            "opened": self.opened,
            "clicked": self.clicked,
            "converted": self.converted,
            "unsubscribed": self.unsubscribed,
            "bounced": self.bounced,
        }

    @property
    def owned_by(self) -> str:
        return self.owner.full_name if self.owner else ""
