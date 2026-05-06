from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.info
    read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[NotificationType] = None
    read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
