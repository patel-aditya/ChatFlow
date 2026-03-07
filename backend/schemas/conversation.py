from pydantic import BaseModel
from typing import List, Optional

from datetime import datetime


class ConversationCreate(BaseModel):
    name: Optional[str] = None
    is_group: bool
    member_ids: List[int]

class ConversationOut(BaseModel):
    id: int
    name: Optional[str] = None
    is_group: bool
    created_at: datetime

    class Config:
        from_attributes = True
    
class ConversationMemberOut(BaseModel):
    user_id: int
    conversation_id: int
    joined_at: datetime

    class Config:
        from_attributes = True


class ConversationMemberAdd(BaseModel):
    conversation_id: int
    user_id: int
