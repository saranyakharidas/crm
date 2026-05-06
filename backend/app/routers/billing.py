from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.billing import Quote, Invoice, QuoteStatus, InvoiceStatus
from app.models.user import User
from app.schemas.billing import (
    QuoteCreate, QuoteResponse, QuoteUpdate,
    InvoiceCreate, InvoiceResponse, InvoiceUpdate
)
from datetime import datetime
import uuid

router = APIRouter(tags=["billing"])

# --- Quotes ---

@router.get("/quotes", response_model=List[QuoteResponse])
def get_quotes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.scalars(
        select(Quote)
        .where(Quote.owner_id == current_user.id)
        .order_by(Quote.created_at.desc())
    ).all()

@router.post("/quotes", response_model=QuoteResponse)
def create_quote(
    quote_in: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Generate a simple quote number
    count = db.scalar(select(func.count(Quote.id))) or 0
    quote_number = f"QUO-{datetime.now().year}-{count + 1001:04d}"
    
    quote = Quote(
        **quote_in.model_dump(),
        number=quote_number,
        owner_id=current_user.id,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote

@router.put("/quotes/{quote_id}", response_model=QuoteResponse)
def update_quote(
    quote_id: str,
    quote_in: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    quote = db.get(Quote, quote_id)
    if not quote or quote.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    update_data = quote_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quote, field, value)
    
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote

# --- Invoices ---

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.scalars(
        select(Invoice)
        .where(Invoice.owner_id == current_user.id)
        .order_by(Invoice.created_at.desc())
    ).all()

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    count = db.scalar(select(func.count(Invoice.id))) or 0
    invoice_number = f"INV-{datetime.now().year}-{count + 1001:04d}"
    
    invoice = Invoice(
        **invoice_in.model_dump(),
        number=invoice_number,
        owner_id=current_user.id,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    invoice_in: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    invoice = db.get(Invoice, invoice_id)
    if not invoice or invoice.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice
