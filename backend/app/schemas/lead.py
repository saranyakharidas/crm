from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.lead import LeadSource, LeadStatus


class LeadBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = ""
    company: str = ""
    position: str = ""
    source: LeadSource = LeadSource.website
    status: LeadStatus = LeadStatus.new
    score: int = 50
    assigned_to: str = ""
    notes: str = ""
    last_activity_at: str


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    source: LeadSource | None = None
    status: LeadStatus | None = None
    score: int | None = None
    assigned_to: str | None = None
    notes: str | None = None
    last_activity_at: str | None = None


class LeadResponse(LeadBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
