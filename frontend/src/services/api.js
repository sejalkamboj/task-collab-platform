const API_BASE = 'https://taskcollab-api.onrender.com/api/v1'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const authApi = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login:  (body) => request('/auth/login',  { method: 'POST', body: JSON.stringify(body) }),
  me:     ()     => request('/auth/me'),
}

export const boardsApi = {
  list:   ()         => request('/boards'),
  get:    (id)       => request(`/boards/${id}`),
  create: (body)     => request('/boards',    { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body) => request(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id)       => request(`/boards/${id}`, { method: 'DELETE' }),
}

export const listsApi = {
  create: (body)     => request('/lists',      { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body) => request(`/lists/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (id)       => request(`/lists/${id}`, { method: 'DELETE' }),
}

export const tasksApi = {
  create: (body)     => request('/tasks',       { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body) => request(`/tasks/${id}`,  { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (id)       => request(`/tasks/${id}`,  { method: 'DELETE' }),
  move:   (id, body) => request(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify(body) }),
}

export const activityApi = {
  board: (boardId, page = 1) => request(`/activity/board/${boardId}?page=${page}&limit=30`),
}
