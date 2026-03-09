from pydantic import BaseModel, EmailStr
from typing import Optional
class UserBase(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserCreate(UserBase):
    pass

class UserLogin(BaseModel):
    login: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar: Optional[str] = None
    is_online: bool

    class Config:
        from_attributes = True
    
class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None