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
    db = SessionLocal()
    try:
        print(f"🔌 Attempting to connect user {user_id}")
        await manager.connect(user_id, websocket)
        print(f"✅ User {user_id} connected successfully")

        user = db.query(User).filter(User.id == user_id).first()
        print(f"👤 User found: {user}")

        if user:
            user.is_online = True
            db.commit()
            print(f"✅ User {user_id} marked online")

        while True:
            data = await websocket.receive_text()
            print(f"📨 Message from {user_id}: {data}")
            payload = json.loads(data)
            event_type = payload.get("type")

            if event_type == "message":
                conversation_id = payload.get("conversation_id")
                content = payload.get("content")
                message_type = payload.get("message_type", "text")
                file_url = payload.get("file_url")

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
                print(f"💾 Message saved: {new_message.id}")

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

                member_ids = get_conversation_member_ids(conversation_id, db)
                print(f"📢 Broadcasting to members: {member_ids}")
                await manager.broadcast_to_users(message_payload, member_ids)

            elif event_type == "typing":
                conversation_id = payload.get("conversation_id")
                is_typing = payload.get("is_typing")
                typing_payload = {
                    "type": "typing",
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "is_typing": is_typing
                }
                member_ids = get_conversation_member_ids(conversation_id, db)
                other_member_ids = [id for id in member_ids if id != user_id]
                await manager.broadcast_to_users(typing_payload, other_member_ids)

            elif event_type == "read":
                conversation_id = payload.get("conversation_id")
                db.query(Message).filter(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,
                    Message.is_read == False
                ).update({"is_read": True})
                db.commit()
                read_payload = {
                    "type": "read",
                    "conversation_id": conversation_id,
                    "user_id": user_id
                }
                member_ids = get_conversation_member_ids(conversation_id, db)
                other_member_ids = [id for id in member_ids if id != user_id]
                await manager.broadcast_to_users(read_payload, other_member_ids)

    except WebSocketDisconnect:
        print(f"🔌 User {user_id} disconnected")
        manager.disconnect(user_id)
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = False
            db.commit()

    except Exception as e:
        print(f"🔥 CRASH for user {user_id}: {e}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()
        print(f"🗄️ DB session closed for user {user_id}")