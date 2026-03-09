from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base

# import all models so tables get created
import models.user
import models.conversations
import models.conversation_member
import models.message

# import all routers
from routers import auth, users, conversations, messages
from routers import websocket as websocket_router


# create all tables in database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ChatFlow API",
    description="Real-time chat application API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(websocket_router.router)

@app.get("/")
def root():
    return {"message": "ChatFlow API is running 🚀"}