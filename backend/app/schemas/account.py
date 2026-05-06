from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.account import AccountIndustry, AccountType


class AccountAddress(BaseModel):
    street: str = ""
    city: str = ""
    state: str = ""
    country: str = ""


class AccountBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    domain: str = ""
    industry: AccountIndustry = AccountIndustry.other
    type: AccountType = AccountType.prospect
    employees: int = 0
    annual_revenue: float = 0
    phone: str = ""
    email: EmailStr | str = ""
    website: str = ""
    address: AccountAddress = AccountAddress()
    description: str = ""
    tags: list[str] = []
    contact_ids: list[str] = []
    deal_ids: list[str] = []


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    industry: AccountIndustry | None = None
    type: AccountType | None = None
    employees: int | None = None
    annual_revenue: float | None = None
    phone: str | None = None
    email: EmailStr | str | None = None
    website: str | None = None
    address: AccountAddress | None = None
    description: str | None = None
    tags: list[str] | None = None
    contact_ids: list[str] | None = None
    deal_ids: list[str] | None = None


class AccountResponse(AccountBase):
    id: str
    owner_id: str
    owned_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
