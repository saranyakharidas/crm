from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.ticket import TicketStatus, TicketPriority, TicketCategory

class TicketMessageSchema(BaseModel):
    id: str
    ticket_id: str
    sender_id: str
    message: str
    is_internal: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TicketBase(BaseModel):
    subject: str
    description: str
    status: TicketStatus = TicketStatus.new
    priority: TicketPriority = TicketPriority.medium
    category: TicketCategory = TicketCategory.general
    contact_id: Optional[str] = None
    account_id: Optional[str] = None
    assigned_to: Optional[str] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[TicketCategory] = None
    assigned_to: Optional[str] = None

class TicketResponse(TicketBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[TicketMessageSchema] = []

    model_config = ConfigDict(from_attributes=True)
