from fastapi import FastAPI
from models import user, message, conversation_member, conversations
from database import Base, engine

Base.metadata.create_all(bind = engine)

app = FastAPI("ChatFlow API")

@app.get("/")
async def root():
    return {"message": "Hello World"} 