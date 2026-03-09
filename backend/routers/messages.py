from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from core.auth import get_current_user
from models.user import User
from models.message import Message
from models.conversation_member import ConversationMember
from schemas.message import MessageOut, MessageUpdate


router = APIRouter(prefix="/messages", tags=["Messages"])


# ── Get Message History ───────────────────────────────────────────
@router.get("/{conversation_id}", response_model=List[MessageOut])
def get_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # check if current user is a member of this conversation
    is_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation"
        )

    # fetch messages with pagination
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.asc()
    ).offset(skip).limit(limit).all()

    return messages


# ── Delete Message ────────────────────────────────────────────────
@router.delete("/{message_id}", status_code=status.HTTP_200_OK)
def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # find the message
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # only sender can delete their own message
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages"
        )

    db.delete(message)
    db.commit()

    return {"detail": "Message deleted successfully"}


# ── Edit Message ──────────────────────────────────────────────────
@router.patch("/{message_id}", response_model=MessageOut)
def edit_message(
    message_id: int,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # find the message
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # only sender can edit their own message
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own messages"
        )

    # only text messages can be edited
    if message.message_type != "text":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only text messages can be edited"
        )

    # update content
    if message_data.content is not None:
        message.content = message_data.content

    db.commit()
    db.refresh(message)
    return message