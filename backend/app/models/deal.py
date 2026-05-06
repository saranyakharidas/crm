import enum
from sqlalchemy import Enum, ForeignKey, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

class DealStage(str, enum.Enum):
    lead = "lead"
    qualified = "qualified"
    proposal = "proposal"
    negotiation = "negotiation"
    closed_won = "closed-won"
    closed_lost = "closed-lost"

class Deal(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "deals"

    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    stage: Mapped[DealStage] = mapped_column(
        Enum(DealStage, native_enum=False),
        default=DealStage.lead,
        nullable=False,
    )
    probability: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    expected_close_date: Mapped[str | None] = mapped_column(String(40), nullable=True)
    actual_close_date: Mapped[str | None] = mapped_column(String(40), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    
    contact_id: Mapped[str | None] = mapped_column(ForeignKey("contacts.id"), nullable=True, index=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="deals")
    contact = relationship("Contact")
