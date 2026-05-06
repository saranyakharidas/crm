from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])


def serialize_account(account: Account) -> AccountResponse:
    return AccountResponse.model_validate(account)


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AccountResponse]:
    accounts = db.scalars(select(Account).order_by(Account.created_at.desc())).all()
    return [serialize_account(account) for account in accounts]


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountResponse:
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return serialize_account(account)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountResponse:
    account = Account(
        name=payload.name,
        domain=payload.domain,
        industry=payload.industry,
        type=payload.type,
        employees=payload.employees,
        annual_revenue=payload.annual_revenue,
        phone=payload.phone,
        email=payload.email,
        website=payload.website,
        street=payload.address.street,
        city=payload.address.city,
        state=payload.address.state,
        country=payload.address.country,
        description=payload.description,
        tags=payload.tags,
        contact_ids=payload.contact_ids,
        deal_ids=payload.deal_ids,
        owner_id=current_user.id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: str,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountResponse:
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    updates = payload.model_dump(exclude_unset=True)
    address = updates.pop("address", None)

    for field, value in updates.items():
        setattr(account, field, value)

    if address:
        account.street = address.get("street", "")
        account.city = address.get("city", "")
        account.state = address.get("state", "")
        account.country = address.get("country", "")

    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
