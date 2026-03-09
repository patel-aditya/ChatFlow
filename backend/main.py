from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base

# import all models so tables get created
from models import user, conversations, conversation_member, message

# import all routers
from routers import auth, users, conversations, messages, websocket


# create all tables in database on startup
Base.metadata.create_all(bind=engine)

# create FastAPI app
app = FastAPI(
    title="ChatFlow API",
    description="Real-time chat application API",
    version="1.0.0"
)

# ── CORS Middleware ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # React Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include Routers ───────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(websocket.router)


# ── Health Check ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "ChatFlow API is running 🚀"}


# ### 🔍 Deep Explanation

# ---

# **`Base.metadata.create_all(bind=engine)`**
# - **What:** Creates all database tables automatically when the app starts
# - **How does it know which tables to create?** Because we imported all models above — each model inherits from `Base` and registers itself. `create_all` reads all registered models and creates their tables
# - **Important:** This only creates tables that **don't exist yet** — it never drops or modifies existing tables. So running this multiple times is safe

# ---

# **`CORSMiddleware`**
# - **What is CORS?** Cross-Origin Resource Sharing — a browser security rule that blocks requests from a different domain/port
# - **The problem:** React runs on `http://localhost:5173` and FastAPI runs on `http://localhost:8000` — different ports = different origins = browser blocks the request
# - **`allow_origins=["http://localhost:5173"]`** — tells the browser "requests from this origin are allowed"
# - **`allow_credentials=True`** — allows cookies and authorization headers to be sent
# - **`allow_methods=["*"]`** — allows all HTTP methods (GET, POST, PATCH, DELETE etc.)
# - **`allow_headers=["*"]`** — allows all headers including `Authorization` (needed for JWT)

# ---

# **`app.include_router(auth.router)`**
# - Registers all routes from `auth.py` into the main app
# - Since `auth.router` already has `prefix="/auth"`, all auth routes become `/auth/register`, `/auth/login` etc.
# - Same for all other routers

# ---

# ### ✅ Complete API routes after all routers are included:
# ```
# Auth:
#   POST   /auth/register
#   POST   /auth/login

# Users:
#   GET    /users/me
#   PATCH  /users/me
#   GET    /users/search?query=
#   GET    /users/{user_id}

# Conversations:
#   POST   /conversations/
#   GET    /conversations/
#   GET    /conversations/{id}
#   POST   /conversations/{id}/members

# Messages:
#   GET    /messages/{conversation_id}
#   DELETE /messages/{message_id}
#   PATCH  /messages/{message_id}

# WebSocket:
#   WS     /ws/{user_id}