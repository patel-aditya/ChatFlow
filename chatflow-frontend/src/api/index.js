const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const WS_URL   = import.meta.env.VITE_WS_URL  || "ws://localhost:8000"

// ── Helpers ──────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token")

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
})

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(err.detail || "Something went wrong")
  }
  return res.json()
}

// ── Auth ─────────────────────────────────────────────────────────
export const registerUser = async ({ username, email, password }) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  })
  return handleResponse(res)
}

export const loginUser = async (login, password) => {
  const form = new URLSearchParams()
  form.append("username", login)
  form.append("password", password)
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })
  return handleResponse(res)
}

// ── Users ─────────────────────────────────────────────────────────
export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/users/me`, { headers: authHeaders() })
  return handleResponse(res)
}

export const searchUsers = async (query) => {
  const res = await fetch(`${BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const getUserById = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, { headers: authHeaders() })
  return handleResponse(res)
}

export const updateMe = async (data) => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

// ── Conversations ─────────────────────────────────────────────────
export const getConversations = async () => {
  const res = await fetch(`${BASE_URL}/conversations/`, { headers: authHeaders() })
  return handleResponse(res)
}

export const createConversation = async (data) => {
  const res = await fetch(`${BASE_URL}/conversations/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export const addMemberToGroup = async (conversationId, userId) => {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/members`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ conversation_id: conversationId, user_id: userId }),
  })
  return handleResponse(res)
}

// ── Messages ──────────────────────────────────────────────────────
export const getMessages = async (conversationId, skip = 0, limit = 50) => {
  const res = await fetch(
    `${BASE_URL}/messages/${conversationId}?skip=${skip}&limit=${limit}`,
    { headers: authHeaders() }
  )
  return handleResponse(res)
}

export const deleteMessage = async (messageId) => {
  const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const editMessage = async (messageId, content) => {
  const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  })
  return handleResponse(res)
}

// ── WebSocket URL ─────────────────────────────────────────────────
export const getWebSocketUrl = (userId) => `${WS_URL}/ws/${userId}`
