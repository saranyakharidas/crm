from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.deal import DealStage

class DealBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    value: float = 0.0
    currency: str = "USD"
    stage: DealStage = DealStage.lead
    probability: int = 10
    expected_close_date: str | None = None
    actual_close_date: str | None = None
    notes: str = ""
    contact_id: str | None = None

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    title: str | None = None
    value: float | None = None
    currency: str | None = None
    stage: DealStage | None = None
    probability: int | None = None
    expected_close_date: str | None = None
    actual_close_date: str | None = None
    notes: str | None = None
    contact_id: str | None = None

class DealResponse(DealBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
