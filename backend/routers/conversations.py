from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from core.auth import get_current_user
from models.user import User
from models.conversations import Conversation
from models.conversation_member import ConversationMember
from schemas.conversation import ConversationCreate, ConversationOut, ConversationMemberAdd


router = APIRouter(prefix="/conversations", tags=["Conversations"])


# ── Create Conversation ───────────────────────────────────────────
@router.post("/", response_model=ConversationOut)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # always include the creator in member list
    member_ids = list(set(conversation_data.member_ids + [current_user.id]))

    # ── Private Chat ──────────────────────────────────────────────
    if not conversation_data.is_group:

        # private chat must have exactly 2 members
        if len(member_ids) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Private conversation must have exactly 2 members"
            )

        # find the other user's id
        other_user_id = [id for id in member_ids if id != current_user.id][0]

        # check if private conversation already exists between these two users
        current_user_conversations = db.query(ConversationMember.conversation_id).filter(
            ConversationMember.user_id == current_user.id
        ).subquery()

        other_user_conversations = db.query(ConversationMember.conversation_id).filter(
            ConversationMember.user_id == other_user_id
        ).subquery()

        existing_conversation = db.query(Conversation).filter(
            Conversation.id.in_(current_user_conversations),
            Conversation.id.in_(other_user_conversations),
            Conversation.is_group == False
        ).first()

        # return existing conversation if found
        if existing_conversation:
            return existing_conversation

    # ── Group Chat ────────────────────────────────────────────────
    # create new conversation
    new_conversation = Conversation(
        name=conversation_data.name,
        is_group=conversation_data.is_group
    )

    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)

    # add all members to conversation_members table
    for user_id in member_ids:
        member = ConversationMember(
            conversation_id=new_conversation.id,
            user_id=user_id
        )
        db.add(member)

    db.commit()
    return new_conversation


# ── Get All My Conversations ──────────────────────────────────────
@router.get("/", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # get all conversation_ids where current user is a member
    conversation_ids = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == current_user.id
    ).all()

    # flatten list of tuples to list of ints
    # db returns [(1,), (2,), (3,)] so we extract just the id
    ids = [id[0] for id in conversation_ids]

    # fetch all those conversations
    conversations = db.query(Conversation).filter(
        Conversation.id.in_(ids)
    ).all()

    return conversations


# ── Get Single Conversation ───────────────────────────────────────
@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # check if conversation exists
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # check if current user is a member
    is_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation"
        )

    return conversation


# ── Add Member to Group ───────────────────────────────────────────
@router.post("/{conversation_id}/members", status_code=status.HTTP_201_CREATED)
def add_member(
    conversation_id: int,
    member_data: ConversationMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # check if conversation exists
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # only group chats can add members
    if not conversation.is_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add members to a private conversation"
        )

    # check if user is already a member
    existing_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == member_data.user_id
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this conversation"
        )

    # add new member
    new_member = ConversationMember(
        conversation_id=conversation_id,
        user_id=member_data.user_id
    )

    db.add(new_member)
    db.commit()

    return {"detail": "Member added successfully"}