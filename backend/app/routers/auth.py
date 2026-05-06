from typing import Annotated

from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import AuthUserResponse, LoginRequest, SignupRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=AuthUserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    db: Session = Depends(get_db),
    payload: Annotated[LoginRequest | None, Body()] = None,
    username: Annotated[str | None, Form()] = None,
    password: Annotated[str | None, Form()] = None,
) -> TokenResponse:
    email = username.strip().lower() if username else None
    secret = password

    if payload is not None:
        email = payload.email.lower()
        secret = payload.password

    if not email or not secret:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either JSON email/password or form username/password",
        )

    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(secret, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=AuthUserResponse.model_validate(user),
    )


@router.get("/me", response_model=AuthUserResponse)
def me(current_user: User = Depends(get_current_user)) -> AuthUserResponse:
    return AuthUserResponse.model_validate(current_user)
