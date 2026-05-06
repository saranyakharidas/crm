from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.models import account, campaign, contact, deal, lead, price_book, product, task, user, notification  # noqa: F401
from app.routers import (
    accounts, activities, auth, automation, billing, campaigns, contacts, dashboard, deals, leads,
    notifications, price_books, products, recurring_tasks, tasks, tickets
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(contacts.router)
app.include_router(leads.router)
app.include_router(campaigns.router)
app.include_router(deals.router)
app.include_router(tasks.router)
app.include_router(products.router)
app.include_router(price_books.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(billing.router)
app.include_router(tickets.router)
app.include_router(automation.router)
app.include_router(recurring_tasks.router)
app.include_router(activities.router)

@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
