import enum

from sqlalchemy import Enum, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class ProductCategory(str, enum.Enum):
    software = "software"
    hardware = "hardware"
    service = "service"
    support = "support"
    training = "training"
    addon = "addon"


class ProductStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    discontinued = "discontinued"


class PricingModel(str, enum.Enum):
    one_time = "one_time"
    monthly = "monthly"
    annual = "annual"
    per_user = "per_user"
    usage = "usage"


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[ProductCategory] = mapped_column(
        Enum(ProductCategory, native_enum=False),
        default=ProductCategory.software,
        nullable=False,
    )
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, native_enum=False),
        default=ProductStatus.active,
        nullable=False,
    )
    pricing_model: Mapped[PricingModel] = mapped_column(
        Enum(PricingModel, native_enum=False),
        default=PricingModel.one_time,
        nullable=False,
    )
    base_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    variants: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="", nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="products")

    @property
    def owned_by(self) -> str:
        return self.owner.full_name if self.owner else ""
