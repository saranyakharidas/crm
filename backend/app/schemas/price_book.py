from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PriceBookEntry(BaseModel):
    id: str | None = None
    product_id: str
    price: float = 0
    discount: float | None = None


class PriceBookBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = ""
    currency: str = Field(default="USD", min_length=1, max_length=10)
    is_default: bool = False
    entries: list[PriceBookEntry] = []
    valid_from: datetime | None = None
    valid_to: datetime | None = None


class PriceBookCreate(PriceBookBase):
    pass


class PriceBookUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    currency: str | None = None
    is_default: bool | None = None
    entries: list[PriceBookEntry] | None = None
    valid_from: datetime | None = None
    valid_to: datetime | None = None


class PriceBookResponse(PriceBookBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
