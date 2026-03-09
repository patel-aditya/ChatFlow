from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json

from database import get_db, SessionLocal
from core.connection_manager import manager
from models.message import Message
from models.conversation_member import ConversationMember
from models.user import User


router = APIRouter(tags=["WebSocket"])


# ── helper: get all member ids of a conversation ──────────────────
def get_conversation_member_ids(conversation_id: int, db: Session):
    members = db.query(ConversationMember.user_id).filter(
        ConversationMember.conversation_id == conversation_id
    ).all()
    return [member[0] for member in members]


# ── WebSocket Connection ──────────────────────────────────────────
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id: int, websocket: WebSocket):
    # open a new database session manually
    # we cannot use Depends() in WebSocket routes
    db = SessionLocal()

    try:
        # connect user
        await manager.connect(user_id, websocket)

        # update user online status
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = True
            db.commit()

        # keep listening for messages
        while True:
            # wait for incoming data from client
            data = await websocket.receive_text()
            payload = json.loads(data)

            # get event type
            event_type = payload.get("type")

            # ── Handle Text/Media Message ─────────────────────────
            if event_type == "message":
                conversation_id = payload.get("conversation_id")
                content = payload.get("content")
                message_type = payload.get("message_type", "text")
                file_url = payload.get("file_url")

                # save message to database
                new_message = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=content,
                    message_type=message_type,
                    file_url=file_url
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)

                # build response payload
                message_payload = {
                    "type": "message",
                    "id": new_message.id,
                    "conversation_id": conversation_id,
                    "sender_id": user_id,
                    "content": content,
                    "message_type": message_type,
                    "file_url": file_url,
                    "is_read": False,
                    "created_at": str(new_message.created_at)
                }

                # get all members of this conversation
                member_ids = get_conversation_member_ids(conversation_id, db)

                # broadcast to all members
                await manager.broadcast_to_users(message_payload, member_ids)

            # ── Handle Typing Indicator ───────────────────────────
            elif event_type == "typing":
                conversation_id = payload.get("conversation_id")
                is_typing = payload.get("is_typing")

                # build typing payload
                typing_payload = {
                    "type": "typing",
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "is_typing": is_typing
                }

                # get all members except the sender
                member_ids = get_conversation_member_ids(conversation_id, db)
                other_member_ids = [id for id in member_ids if id != user_id]

                # send typing indicator to others only
                await manager.broadcast_to_users(typing_payload, other_member_ids)

            # ── Handle Mark as Read ───────────────────────────────
            elif event_type == "read":
                conversation_id = payload.get("conversation_id")

                # mark all unread messages in this conversation as read
                db.query(Message).filter(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,
                    Message.is_read == False
                ).update({"is_read": True})
                db.commit()

                # notify all members that messages were read
                read_payload = {
                    "type": "read",
                    "conversation_id": conversation_id,
                    "user_id": user_id
                }

                member_ids = get_conversation_member_ids(conversation_id, db)
                other_member_ids = [id for id in member_ids if id != user_id]
                await manager.broadcast_to_users(read_payload, other_member_ids)

    except WebSocketDisconnect:
        # user disconnected
        manager.disconnect(user_id)

        # update user offline status
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = False
            db.commit()

    finally:
        # always close the database session
        db.close()