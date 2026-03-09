from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import UserCreate, UserLogin, UserOut, UserUpdate, Token
from core.security import hash_password
from models.user import User
from core.security import verify_password
from core.auth import create_access_token, decode_access_token



router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
def register(new_user: UserCreate,db: Session = Depends(get_db)):
    user = db.query(User).filter(or_(User.email == new_user.email, User.username == new_user.username)).first()
    if user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User Already Exist")
    
    hashed_password = hash_password(new_user.password)

    user = User(
        email = new_user.email,
        username = new_user.username,
        password = hashed_password
        )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(or_(User.email == credentials.login, User.username == credentials.login)).first()

    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # create and return jwt token
    access_token = create_access_token(data={"sub":str(user.id)})
    return Token(access_token=access_token, token_type="bearer")



    
