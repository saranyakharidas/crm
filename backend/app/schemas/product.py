from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.product import PricingModel, ProductCategory, ProductStatus


class ProductVariant(BaseModel):
    id: str
    name: str
    price: float
    max_users: int | None = None


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str = Field(min_length=1, max_length=80)
    description: str = ""
    category: ProductCategory = ProductCategory.software
    status: ProductStatus = ProductStatus.active
    pricing_model: PricingModel = PricingModel.one_time
    base_price: float = 0
    variants: list[ProductVariant] = []
    tax_rate: float = 0
    unit: str = ""
    tags: list[str] = []
    image_url: str | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    category: ProductCategory | None = None
    status: ProductStatus | None = None
    pricing_model: PricingModel | None = None
    base_price: float | None = None
    variants: list[ProductVariant] | None = None
    tax_rate: float | None = None
    unit: str | None = None
    tags: list[str] | None = None
    image_url: str | None = None


class ProductResponse(ProductBase):
    id: str
    owner_id: str
    owned_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
