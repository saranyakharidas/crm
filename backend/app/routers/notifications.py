from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationUpdate

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all notifications for the current user."""
    notifications = db.scalars(
        select(Notification)
        .where(Notification.owner_id == current_user.id)
        .order_by(Notification.created_at.desc())
    ).all()
    return notifications

@router.post("", response_model=NotificationResponse)
def create_notification(
    notification_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new notification."""
    notification = Notification(
        **notification_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: str,
    notification_in: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update a notification."""
    notification = db.get(Notification, notification_id)
    if not notification or notification.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_data = notification_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(notification, field, value)
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Mark all notifications as read."""
    db.query(Notification).where(Notification.owner_id == current_user.id).update({"read": True})
    db.commit()
    return {"status": "ok"}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a notification."""
    notification = db.get(Notification, notification_id)
    if not notification or notification.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    return None
