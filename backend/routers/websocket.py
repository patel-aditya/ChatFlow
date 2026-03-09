from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
import json

from database import SessionLocal
from core.connection_manager import manager
from core.auth import decode_access_token
from models.message import Message
from models.conversation_member import ConversationMember
from models.user import User


router = APIRouter(tags=["WebSocket"])


# ── Helper: get all member ids of a conversation ──────────────────
def get_conversation_member_ids(conversation_id: int, db: Session):
    members = db.query(ConversationMember.user_id).filter(
        ConversationMember.conversation_id == conversation_id
    ).all()
    return [member[0] for member in members]


# ── Helper: mark user online/offline safely ───────────────────────
def set_user_online(user_id: int, db: Session, status: bool):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_online = status
        db.commit()


# ── WebSocket Connection ──────────────────────────────────────────
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    user_id: int,
    websocket: WebSocket,
    token: str = Query(...)         # FIX 2: require JWT token as query param
):
    db = SessionLocal()

    # ── Auth Check ────────────────────────────────────────────────
    try:
        payload = decode_access_token(token)
        token_user_id = int(payload.get("sub"))

        if token_user_id != user_id:
            print(f"🚫 Token user_id {token_user_id} != path user_id {user_id}")
            await websocket.close(code=1008)   # 1008 = Policy Violation
            db.close()
            return

    except Exception as e:
        print(f"🚫 Invalid token for user {user_id}: {e}")
        await websocket.close(code=1008)
        db.close()
        return

    # ── Main Connection Loop ──────────────────────────────────────
    try:
        print(f"🔌 Attempting to connect user {user_id}")
        await manager.connect(user_id, websocket)
        print(f"✅ User {user_id} connected successfully")

        set_user_online(user_id, db, True)
        print(f"✅ User {user_id} marked online")

        while True:
            data = await websocket.receive_text()
            print(f"📨 Message from {user_id}: {data}")
            payload = json.loads(data)
            event_type = payload.get("type")

            # ── Send Message ──────────────────────────────────────
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

            # ── Typing Indicator ──────────────────────────────────
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

            # ── Read Receipt ──────────────────────────────────────
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

    # ── Clean Disconnect ──────────────────────────────────────────
    except WebSocketDisconnect:
        print(f"🔌 User {user_id} disconnected")
        manager.disconnect(user_id)
        set_user_online(user_id, db, False)

    # ── FIX 1: Cleanup on ANY unexpected crash ────────────────────
    except Exception as e:
        print(f"🔥 CRASH for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(user_id)          # remove ghost connection
        set_user_online(user_id, db, False)  # mark user offline

    finally:
        db.close()
        print(f"🗄️ DB session closed for user {user_id}")