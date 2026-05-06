from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.campaign import CampaignStatus, CampaignType


class CampaignEmail(BaseModel):
    subject: str = ""
    preheader: str = ""
    body: str = ""


class CampaignMetrics(BaseModel):
    sent: int = 0
    delivered: int = 0
    opened: int = 0
    clicked: int = 0
    converted: int = 0
    unsubscribed: int = 0
    bounced: int = 0


class CampaignBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = ""
    type: CampaignType = CampaignType.email
    status: CampaignStatus = CampaignStatus.draft
    tags: list[str] = []
    target_segment: str = ""
    audience_size: int = 0
    start_date: str
    end_date: str | None = None
    scheduled_at: str | None = None
    budget: float = 0
    spent: float = 0
    email: CampaignEmail | None = None
    metrics: CampaignMetrics = CampaignMetrics()


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    type: CampaignType | None = None
    status: CampaignStatus | None = None
    tags: list[str] | None = None
    target_segment: str | None = None
    audience_size: int | None = None
    start_date: str | None = None
    end_date: str | None = None
    scheduled_at: str | None = None
    budget: float | None = None
    spent: float | None = None
    email: CampaignEmail | None = None
    metrics: CampaignMetrics | None = None


class CampaignResponse(CampaignBase):
    id: str
    owner_id: str
    owned_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
