from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate

router = APIRouter(prefix="/activities", tags=["activities"])

@router.get("", response_model=List[ActivityResponse])
def get_activities(
    contact_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = select(Activity).where(Activity.owner_id == current_user.id)
    
    if contact_id:
        query = query.where(Activity.contact_id == contact_id)
    if deal_id:
        query = query.where(Activity.deal_id == deal_id)
        
    return db.scalars(query.order_by(Activity.created_at.desc())).all()

@router.post("", response_model=ActivityResponse)
def create_activity(
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    activity = Activity(
        **activity_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    activity = db.get(Activity, activity_id)
    if not activity or activity.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    db.delete(activity)
    db.commit()
    return None
