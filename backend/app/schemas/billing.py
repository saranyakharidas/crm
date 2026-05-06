from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.billing import QuoteStatus, InvoiceStatus

class LineItemSchema(BaseModel):
    id: Optional[str] = None
    description: str
    quantity: float
    unit_price: float
    discount: float = 0.0
    tax_rate: float = 0.0

class QuoteBase(BaseModel):
    title: str
    status: QuoteStatus = QuoteStatus.draft
    deal_id: Optional[str] = None
    account_name: str
    contact_name: str
    contact_email: str
    line_items: List[LineItemSchema] = []
    notes: str = ""
    terms: str = ""
    valid_until: datetime
    currency: str = "USD"

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[QuoteStatus] = None
    line_items: Optional[List[LineItemSchema]] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    valid_until: Optional[datetime] = None

class QuoteResponse(QuoteBase):
    id: str
    number: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    title: str
    status: InvoiceStatus = InvoiceStatus.draft
    quote_id: Optional[str] = None
    deal_id: Optional[str] = None
    account_name: str
    contact_name: str
    contact_email: str
    line_items: List[LineItemSchema] = []
    notes: str = ""
    terms: str = ""
    due_date: datetime
    currency: str = "USD"

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    line_items: Optional[List[LineItemSchema]] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    due_date: Optional[datetime] = None

class InvoiceResponse(InvoiceBase):
    id: str
    number: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
