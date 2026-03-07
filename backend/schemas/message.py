from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    message_type: Optional[str] = None
    file_url: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: Optional[str] = None
    message_type: str = "text"
    file_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MessageUpdate(BaseModel):
    content: Optional[str] = None


class TypingIndicator(BaseModel):
    conversation_id:int
    is_typing:bool

