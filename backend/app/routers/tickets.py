from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.ticket import Ticket, TicketMessage
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.get("", response_model=List[TicketResponse])
def get_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.scalars(
        select(Ticket)
        .where(Ticket.owner_id == current_user.id)
        .order_by(Ticket.created_at.desc())
    ).all()

@router.post("", response_model=TicketResponse)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    ticket = Ticket(
        **ticket_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    ticket = db.get(Ticket, ticket_id)
    if not ticket or ticket.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = ticket_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ticket, field, value)
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/messages")
def add_ticket_message(
    ticket_id: str,
    message: str,
    is_internal: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    ticket = db.get(Ticket, ticket_id)
    if not ticket or ticket.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    msg = TicketMessage(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        message=message,
        is_internal=is_internal,
    )
    db.add(msg)
    db.commit()
    return {"status": "ok"}
