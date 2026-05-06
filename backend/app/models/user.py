import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    sales = "sales"
    support = "support"
    manager = "manager"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False),
        default=UserRole.sales,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    accounts = relationship("Account", back_populates="owner")
    leads = relationship("Lead", back_populates="owner")
    campaigns = relationship("Campaign", back_populates="owner")
    products = relationship("Product", back_populates="owner")
    price_books = relationship("PriceBook", back_populates="owner")
    contacts = relationship("Contact", back_populates="owner")
    deals = relationship("Deal", back_populates="owner")
    tasks = relationship("Task", back_populates="owner")
