from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.activity import ActivityType

class ActivityBase(BaseModel):
    type: ActivityType
    title: str
    description: str = ""
    outcome: Optional[str] = None
    duration: Optional[int] = None
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed: bool = True

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    outcome: Optional[str] = None
    completed: Optional[bool] = None

class ActivityResponse(ActivityBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
