from pydantic import BaseModel

from app.schemas.campaign import CampaignMetrics


class DashboardStat(BaseModel):
    value: int
    change: float


class DashboardStatsResponse(BaseModel):
    total_accounts: DashboardStat
    active_campaigns: DashboardStat
    total_leads: DashboardStat
    total_products: DashboardStat


class DashboardMonthlyActivityPoint(BaseModel):
    month: str
    accounts: int
    leads: int
    campaigns: int
    products: int


class DashboardLeadSourcePoint(BaseModel):
    source: str
    count: int
    percentage: float


class DashboardRecentCampaign(BaseModel):
    id: str
    name: str
    type: str
    status: str
    target_segment: str
    budget: float
    spent: float
    metrics: CampaignMetrics
    start_date: str
    updated_at: str


class DashboardHotLead(BaseModel):
    id: str
    name: str
    company: str
    email: str
    score: int
    source: str
    status: str


class DashboardRecentAccount(BaseModel):
    id: str
    name: str
    industry: str
    type: str
    annual_revenue: float
    updated_at: str


class DashboardTopProduct(BaseModel):
    id: str
    name: str
    code: str
    category: str
    pricing_model: str
    base_price: float
    status: str


class DashboardSummaryResponse(BaseModel):
    stats: DashboardStatsResponse
    monthly_activity: list[DashboardMonthlyActivityPoint]
    lead_sources: list[DashboardLeadSourcePoint]
    campaign_performance: list[DashboardRecentCampaign]
    hot_leads: list[DashboardHotLead]
    recent_accounts: list[DashboardRecentAccount]
    top_products: list[DashboardTopProduct]
