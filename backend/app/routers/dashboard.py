from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.account import Account
from app.models.campaign import Campaign
from app.models.lead import Lead
from app.models.product import Product
from app.models.user import User
from app.schemas.dashboard import (
    DashboardHotLead,
    DashboardLeadSourcePoint,
    DashboardMonthlyActivityPoint,
    DashboardRecentAccount,
    DashboardRecentCampaign,
    DashboardStat,
    DashboardStatsResponse,
    DashboardSummaryResponse,
    DashboardTopProduct,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def calculate_change(items: list, now: datetime) -> float:
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)

    current_count = sum(1 for item in items if item.created_at >= current_start)
    previous_count = sum(1 for item in items if previous_start <= item.created_at < current_start)

    if previous_count == 0:
        return 100.0 if current_count > 0 else 0.0

    return round(((current_count - previous_count) / previous_count) * 100, 1)


def month_buckets(count: int) -> list[tuple[str, str]]:
    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month
    buckets: list[tuple[str, str]] = []

    for offset in range(count - 1, -1, -1):
        display_month = month - offset
        display_year = year
        while display_month <= 0:
            display_month += 12
            display_year -= 1

        key = f"{display_year:04d}-{display_month:02d}"
        label = datetime(display_year, display_month, 1, tzinfo=timezone.utc).strftime("%b")
        buckets.append((key, label))

    return buckets


def group_by_month(items: list, buckets: list[tuple[str, str]]) -> dict[str, int]:
    bucket_map = {key: 0 for key, _label in buckets}
    for item in items:
      key = item.created_at.astimezone(timezone.utc).strftime("%Y-%m")
      if key in bucket_map:
          bucket_map[key] += 1
    return bucket_map


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummaryResponse:
    now = datetime.now(timezone.utc)

    accounts = db.scalars(select(Account).order_by(Account.updated_at.desc())).all()
    campaigns = db.scalars(select(Campaign).order_by(Campaign.updated_at.desc())).all()
    leads = db.scalars(select(Lead).order_by(Lead.updated_at.desc())).all()
    products = db.scalars(select(Product).order_by(Product.updated_at.desc())).all()

    buckets = month_buckets(6)
    account_months = group_by_month(accounts, buckets)
    lead_months = group_by_month(leads, buckets)
    campaign_months = group_by_month(campaigns, buckets)
    product_months = group_by_month(products, buckets)

    monthly_activity = [
        DashboardMonthlyActivityPoint(
            month=label,
            accounts=account_months[key],
            leads=lead_months[key],
            campaigns=campaign_months[key],
            products=product_months[key],
        )
        for key, label in buckets
    ]

    total_leads = len(leads)
    source_counts: dict[str, int] = {}
    for lead in leads:
        source_counts[lead.source.value] = source_counts.get(lead.source.value, 0) + 1

    lead_sources = [
        DashboardLeadSourcePoint(
            source=source,
            count=count,
            percentage=round((count / total_leads) * 100, 1) if total_leads else 0.0,
        )
        for source, count in sorted(source_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    recent_campaigns = [
        DashboardRecentCampaign(
            id=campaign.id,
            name=campaign.name,
            type=campaign.type.value,
            status=campaign.status.value,
            target_segment=campaign.target_segment,
            budget=float(campaign.budget),
            spent=float(campaign.spent),
            metrics=campaign.metrics,
            start_date=campaign.start_date,
            updated_at=campaign.updated_at.isoformat(),
        )
        for campaign in campaigns[:5]
    ]

    hot_leads = [
        DashboardHotLead(
            id=lead.id,
            name=lead.name,
            company=lead.company,
            email=lead.email,
            score=lead.score,
            source=lead.source.value,
            status=lead.status.value,
        )
        for lead in sorted(leads, key=lambda item: item.score, reverse=True)[:4]
    ]

    recent_accounts = [
        DashboardRecentAccount(
            id=account.id,
            name=account.name,
            industry=account.industry.value,
            type=account.type.value,
            annual_revenue=float(account.annual_revenue),
            updated_at=account.updated_at.isoformat(),
        )
        for account in accounts[:4]
    ]

    top_products = [
        DashboardTopProduct(
            id=product.id,
            name=product.name,
            code=product.code,
            category=product.category.value,
            pricing_model=product.pricing_model.value,
            base_price=float(product.base_price),
            status=product.status.value,
        )
        for product in products[:4]
    ]

    stats = DashboardStatsResponse(
        total_accounts=DashboardStat(value=len(accounts), change=calculate_change(accounts, now)),
        active_campaigns=DashboardStat(
            value=sum(1 for campaign in campaigns if campaign.status.value == "active"),
            change=calculate_change(campaigns, now),
        ),
        total_leads=DashboardStat(value=len(leads), change=calculate_change(leads, now)),
        total_products=DashboardStat(value=len(products), change=calculate_change(products, now)),
    )

    return DashboardSummaryResponse(
        stats=stats,
        monthly_activity=monthly_activity,
        lead_sources=lead_sources,
        campaign_performance=recent_campaigns,
        hot_leads=hot_leads,
        recent_accounts=recent_accounts,
        top_products=top_products,
    )
