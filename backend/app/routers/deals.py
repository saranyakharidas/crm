from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.deal import Deal
from app.models.user import User
from app.schemas.deal import DealCreate, DealResponse, DealUpdate

router = APIRouter(prefix="/deals", tags=["deals"])

@router.get("", response_model=list[DealResponse])
def list_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DealResponse]:
    deals = db.scalars(select(Deal).order_by(Deal.created_at.desc())).all()
    return [DealResponse.model_validate(deal) for deal in deals]

@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DealResponse:
    deal = db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return DealResponse.model_validate(deal)

@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    payload: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DealResponse:
    deal = Deal(**payload.model_dump(), owner_id=current_user.id)
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return DealResponse.model_validate(deal)

@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    payload: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DealResponse:
    deal = db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(deal, field, value)

    db.commit()
    db.refresh(deal)
    return DealResponse.model_validate(deal)

@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    deal = db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    db.delete(deal)
    db.commit()
