from fastapi import FastAPI
from models import user, message, conversation_member, conversations
from database import Base, engine
from routers import auth

Base.metadata.create_all(bind = engine)

app = FastAPI(title="ChatFlow API")

app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Hello World"} 