from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from core.auth import get_current_user
from models.user import User
from schemas.user import UserOut, UserUpdate


router = APIRouter(prefix="/users", tags=["Users"])


# ── Get Current User ──────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Update Current User ───────────────────────────────────────────
@router.patch("/me", response_model=UserOut)
def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_data.username is not None:
        current_user.username = user_data.username

    if user_data.avatar is not None:
        current_user.avatar = user_data.avatar

    db.commit()
    db.refresh(current_user)
    return current_user


# ── Search Users ──────────────────────────────────────────────────
@router.get("/search", response_model=List[UserOut])
def search_users(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(
        User.username.ilike(f"%{query}%"),
        User.id != current_user.id
    ).all()

    return users


# ── Get User By ID ────────────────────────────────────────────────
@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user