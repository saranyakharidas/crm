from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.price_book import PriceBook
from app.models.user import User
from app.schemas.price_book import PriceBookCreate, PriceBookResponse, PriceBookUpdate

router = APIRouter(prefix="/price-books", tags=["price-books"])


@router.get("", response_model=list[PriceBookResponse])
def list_price_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PriceBookResponse]:
    price_books = db.scalars(select(PriceBook).order_by(PriceBook.created_at.desc())).all()
    return [PriceBookResponse.model_validate(price_book) for price_book in price_books]


@router.get("/{price_book_id}", response_model=PriceBookResponse)
def get_price_book(
    price_book_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PriceBookResponse:
    price_book = db.get(PriceBook, price_book_id)
    if not price_book:
        raise HTTPException(status_code=404, detail="Price book not found")
    return PriceBookResponse.model_validate(price_book)


@router.post("", response_model=PriceBookResponse, status_code=status.HTTP_201_CREATED)
def create_price_book(
    payload: PriceBookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PriceBookResponse:
    if payload.is_default:
        existing_default = db.scalar(select(PriceBook).where(PriceBook.is_default.is_(True)))
        if existing_default:
            existing_default.is_default = False

    price_book = PriceBook(
        name=payload.name,
        description=payload.description,
        currency=payload.currency,
        is_default=payload.is_default,
        entries=PriceBook.normalize_entries([entry.model_dump() for entry in payload.entries]),
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        owner_id=current_user.id,
    )
    db.add(price_book)
    db.commit()
    db.refresh(price_book)
    return PriceBookResponse.model_validate(price_book)


@router.put("/{price_book_id}", response_model=PriceBookResponse)
def update_price_book(
    price_book_id: str,
    payload: PriceBookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PriceBookResponse:
    price_book = db.get(PriceBook, price_book_id)
    if not price_book:
        raise HTTPException(status_code=404, detail="Price book not found")

    updates = payload.model_dump(exclude_unset=True)
    entries = updates.pop("entries", None)

    if updates.get("is_default") is True:
        existing_default = db.scalar(
            select(PriceBook).where(PriceBook.is_default.is_(True), PriceBook.id != price_book_id)
        )
        if existing_default:
            existing_default.is_default = False

    for field, value in updates.items():
        setattr(price_book, field, value)

    if entries is not None:
        price_book.entries = PriceBook.normalize_entries(entries)

    db.commit()
    db.refresh(price_book)
    return PriceBookResponse.model_validate(price_book)


@router.delete("/{price_book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price_book(
    price_book_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    price_book = db.get(PriceBook, price_book_id)
    if not price_book:
        raise HTTPException(status_code=404, detail="Price book not found")
    if price_book.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default price book")

    db.delete(price_book)
    db.commit()
