import enum

from sqlalchemy import Enum, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class AccountIndustry(str, enum.Enum):
    technology = "technology"
    finance = "finance"
    healthcare = "healthcare"
    retail = "retail"
    manufacturing = "manufacturing"
    education = "education"
    real_estate = "real_estate"
    consulting = "consulting"
    media = "media"
    other = "other"


class AccountType(str, enum.Enum):
    prospect = "prospect"
    customer = "customer"
    partner = "partner"
    vendor = "vendor"
    churned = "churned"


class Account(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "accounts"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    industry: Mapped[AccountIndustry] = mapped_column(
        Enum(AccountIndustry, native_enum=False),
        default=AccountIndustry.other,
        nullable=False,
    )
    type: Mapped[AccountType] = mapped_column(
        Enum(AccountType, native_enum=False),
        default=AccountType.prospect,
        nullable=False,
    )
    employees: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    annual_revenue: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    email: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    website: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    street: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    city: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    state: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    country: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    contact_ids: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    deal_ids: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="accounts")

    @property
    def address(self) -> dict[str, str]:
        return {
            "street": self.street,
            "city": self.city,
            "state": self.state,
            "country": self.country,
        }

    @property
    def owned_by(self) -> str:
        return self.owner.full_name if self.owner else ""
