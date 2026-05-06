import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class PriceBook(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "price_books"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    entries: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="price_books")

    @staticmethod
    def normalize_entries(entries: list[dict]) -> list[dict]:
        normalized: list[dict] = []
        for entry in entries:
            normalized.append(
                {
                    "id": entry.get("id") or str(uuid.uuid4()),
                    "product_id": entry["product_id"],
                    "price": entry["price"],
                    "discount": entry.get("discount"),
                }
            )
        return normalized
