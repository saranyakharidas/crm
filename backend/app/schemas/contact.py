from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.contact import ContactStatus

class ContactBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = ""
    company: str = ""
    position: str = ""
    tags: list[str] = []
    notes: str = ""
    last_contacted_at: str | None = None
    status: ContactStatus = ContactStatus.active

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    tags: list[str] | None = None
    notes: str | None = None
    last_contacted_at: str | None = None
    status: ContactStatus | None = None

class ContactResponse(ContactBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
