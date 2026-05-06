from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignResponse, CampaignUpdate

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def serialize_campaign(campaign: Campaign) -> CampaignResponse:
    data = {
        "id": campaign.id,
        "name": campaign.name,
        "description": campaign.description,
        "type": campaign.type,
        "status": campaign.status,
        "tags": campaign.tags,
        "target_segment": campaign.target_segment,
        "audience_size": campaign.audience_size,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "scheduled_at": campaign.scheduled_at,
        "budget": float(campaign.budget),
        "spent": float(campaign.spent),
        "email": campaign.email_content,
        "metrics": campaign.metrics,
        "owner_id": campaign.owner_id,
        "owned_by": campaign.owned_by,
        "created_at": campaign.created_at,
        "updated_at": campaign.updated_at,
    }
    return CampaignResponse.model_validate(data)


@router.get("", response_model=list[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CampaignResponse]:
    campaigns = db.scalars(select(Campaign).order_by(Campaign.created_at.desc())).all()
    return [serialize_campaign(campaign) for campaign in campaigns]


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return serialize_campaign(campaign)


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = Campaign(
        name=payload.name,
        description=payload.description,
        type=payload.type,
        status=payload.status,
        tags=payload.tags,
        target_segment=payload.target_segment,
        audience_size=payload.audience_size,
        start_date=payload.start_date,
        end_date=payload.end_date,
        scheduled_at=payload.scheduled_at,
        budget=payload.budget,
        spent=payload.spent,
        email_subject=payload.email.subject if payload.email else None,
        email_preheader=payload.email.preheader if payload.email else None,
        email_body=payload.email.body if payload.email else None,
        sent=payload.metrics.sent,
        delivered=payload.metrics.delivered,
        opened=payload.metrics.opened,
        clicked=payload.metrics.clicked,
        converted=payload.metrics.converted,
        unsubscribed=payload.metrics.unsubscribed,
        bounced=payload.metrics.bounced,
        owner_id=current_user.id,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return serialize_campaign(campaign)


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CampaignResponse:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    updates = payload.model_dump(exclude_unset=True)
    tags = updates.pop("tags", None)
    email = updates.pop("email", None)
    metrics = updates.pop("metrics", None)

    for field, value in updates.items():
        setattr(campaign, field, value)

    if tags is not None:
        campaign.tags = tags
    if email is not None:
        campaign.email_subject = email["subject"]
        campaign.email_preheader = email["preheader"]
        campaign.email_body = email["body"]
    if metrics is not None:
        campaign.sent = metrics["sent"]
        campaign.delivered = metrics["delivered"]
        campaign.opened = metrics["opened"]
        campaign.clicked = metrics["clicked"]
        campaign.converted = metrics["converted"]
        campaign.unsubscribed = metrics["unsubscribed"]
        campaign.bounced = metrics["bounced"]

    db.commit()
    db.refresh(campaign)
    return serialize_campaign(campaign)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()
