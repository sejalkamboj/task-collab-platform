# API Contract Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": null,
    "created_at": "2024-02-17T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "error": "User already exists"
}
```

### POST /auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-02-17T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### GET /auth/profile
Get current user profile. **[Protected]**

**Success Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": null,
  "created_at": "2024-02-17T10:00:00Z"
}
```

---

## Board Endpoints

### POST /boards
Create a new board. **[Protected]**

**Request Body:**
```json
{
  "title": "My Project",
  "description": "Project description (optional)"
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "title": "My Project",
  "description": "Project description",
  "owner_id": "user-uuid",
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T10:00:00Z"
}
```

### GET /boards
Get all boards for current user. **[Protected]**

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "My Project",
    "description": "Project description",
    "owner_id": "user-uuid",
    "owner_name": "John Doe",
    "owner_email": "john@example.com",
    "created_at": "2024-02-17T10:00:00Z",
    "updated_at": "2024-02-17T10:00:00Z"
  }
]
```

### GET /boards/:boardId
Get detailed board information with lists and tasks. **[Protected]**

**Success Response (200):**
```json
{
  "id": "uuid",
  "title": "My Project",
  "description": "Project description",
  "owner_id": "user-uuid",
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T10:00:00Z",
  "owner": {
    "id": "user-uuid",
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "id": "user-uuid",
      "email": "member@example.com",
      "full_name": "Jane Smith",
      "role": "member"
    }
  ],
  "lists": [
    {
      "id": "list-uuid",
      "board_id": "board-uuid",
      "title": "To Do",
      "position": 0,
      "created_at": "2024-02-17T10:00:00Z",
      "updated_at": "2024-02-17T10:00:00Z",
      "tasks": [
        {
          "id": "task-uuid",
          "list_id": "list-uuid",
          "title": "Task 1",
          "description": "Task description",
          "position": 0,
          "priority": "medium",
          "due_date": "2024-02-20T00:00:00Z",
          "created_at": "2024-02-17T10:00:00Z",
          "updated_at": "2024-02-17T10:00:00Z",
          "assignees": [
            {
              "id": "user-uuid",
              "full_name": "Jane Smith",
              "email": "jane@example.com"
            }
          ]
        }
      ]
    }
  ]
}
```

### PUT /boards/:boardId
Update board details. **[Protected]**

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "owner_id": "user-uuid",
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T11:00:00Z"
}
```

### DELETE /boards/:boardId
Delete a board (owner only). **[Protected]**

**Success Response (204):**
```
No content
```

### POST /boards/:boardId/members
Add a member to the board. **[Protected]**

**Request Body:**
```json
{
  "email": "newmember@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

## List Endpoints

### POST /boards/:boardId/lists
Create a new list in a board. **[Protected]**

**Request Body:**
```json
{
  "title": "In Progress",
  "position": 1
}
```

**Success Response (201):**
```json
{
  "id": "list-uuid",
  "board_id": "board-uuid",
  "title": "In Progress",
  "position": 1,
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T10:00:00Z"
}
```

### PUT /lists/:listId
Update list details. **[Protected]**

**Request Body:**
```json
{
  "title": "Updated Title",
  "position": 2
}
```

**Success Response (200):**
```json
{
  "id": "list-uuid",
  "board_id": "board-uuid",
  "title": "Updated Title",
  "position": 2,
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T11:00:00Z"
}
```

### DELETE /lists/:listId
Delete a list and all its tasks. **[Protected]**

**Success Response (204):**
```
No content
```

---

## Task Endpoints

### POST /lists/:listId/tasks
Create a new task in a list. **[Protected]**

**Request Body:**
```json
{
  "title": "Implement feature X",
  "description": "Detailed description (optional)",
  "position": 0,
  "priority": "high",
  "due_date": "2024-02-20T00:00:00Z"
}
```

**Success Response (201):**
```json
{
  "id": "task-uuid",
  "list_id": "list-uuid",
  "title": "Implement feature X",
  "description": "Detailed description",
  "position": 0,
  "priority": "high",
  "due_date": "2024-02-20T00:00:00Z",
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T10:00:00Z"
}
```

### PUT /tasks/:taskId
Update task details or move to different list. **[Protected]**

**Request Body (any combination):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "position": 1,
  "list_id": "new-list-uuid",
  "priority": "urgent",
  "due_date": "2024-02-21T00:00:00Z"
}
```

**Success Response (200):**
```json
{
  "id": "task-uuid",
  "list_id": "list-uuid",
  "title": "Updated title",
  "description": "Updated description",
  "position": 1,
  "priority": "urgent",
  "due_date": "2024-02-21T00:00:00Z",
  "created_at": "2024-02-17T10:00:00Z",
  "updated_at": "2024-02-17T11:00:00Z"
}
```

### DELETE /tasks/:taskId
Delete a task. **[Protected]**

**Success Response (204):**
```
No content
```

### POST /tasks/:taskId/assign
Assign a user to a task. **[Protected]**

**Request Body:**
```json
{
  "assigneeId": "user-uuid"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

### DELETE /tasks/:taskId/unassign
Remove user assignment from task. **[Protected]**

**Request Body:**
```json
{
  "assigneeId": "user-uuid"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

### GET /boards/:boardId/tasks/search
Search tasks within a board. **[Protected]**

**Query Parameters:**
- `q` (required): Search query string

**Example:**
```
GET /boards/abc123/tasks/search?q=implement
```

**Success Response (200):**
```json
[
  {
    "id": "task-uuid",
    "list_id": "list-uuid",
    "list_title": "To Do",
    "title": "Implement feature X",
    "description": "Details...",
    "position": 0,
    "priority": "high",
    "due_date": "2024-02-20T00:00:00Z",
    "created_at": "2024-02-17T10:00:00Z",
    "updated_at": "2024-02-17T10:00:00Z",
    "assignees": [
      {
        "id": "user-uuid",
        "full_name": "Jane Smith"
      }
    ]
  }
]
```

---

## Activity Endpoints

### GET /boards/:boardId/activities
Get activity history for a board (paginated). **[Protected]**

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page

**Example:**
```
GET /boards/abc123/activities?page=1&limit=20
```

**Success Response (200):**
```json
{
  "activities": [
    {
      "id": "activity-uuid",
      "board_id": "board-uuid",
      "user_id": "user-uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "action_type": "task_created",
      "entity_type": "task",
      "entity_id": "task-uuid",
      "details": {
        "title": "New task",
        "list_id": "list-uuid"
      },
      "created_at": "2024-02-17T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## WebSocket Events

### Connection
Connect to WebSocket server:
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Room Events

**Join Board:**
```javascript
socket.emit('join-board', boardId);
```

**Leave Board:**
```javascript
socket.emit('leave-board', boardId);
```

### Task Events

**Emit Task Created:**
```javascript
socket.emit('task-created', {
  boardId: 'board-uuid',
  task: { /* task object */ }
});
```

**Listen Task Created:**
```javascript
socket.on('task-created', (task) => {
  // Update UI
});
```

**Emit Task Updated:**
```javascript
socket.emit('task-updated', {
  boardId: 'board-uuid',
  task: { /* task object */ }
});
```

**Listen Task Updated:**
```javascript
socket.on('task-updated', (task) => {
  // Update UI
});
```

**Emit Task Deleted:**
```javascript
socket.emit('task-deleted', {
  boardId: 'board-uuid',
  taskId: 'task-uuid'
});
```

**Listen Task Deleted:**
```javascript
socket.on('task-deleted', (taskId) => {
  // Remove from UI
});
```

**Emit Task Moved:**
```javascript
socket.emit('task-moved', {
  boardId: 'board-uuid',
  taskId: 'task-uuid',
  sourceListId: 'source-list-uuid',
  targetListId: 'target-list-uuid',
  newPosition: 2
});
```

**Listen Task Moved:**
```javascript
socket.on('task-moved', (data) => {
  // Update task position
});
```

### List Events

Similar patterns for:
- `list-created` / `list-updated` / `list-deleted`

### Typing Indicator

**Emit User Typing:**
```javascript
socket.emit('user-typing', {
  boardId: 'board-uuid',
  taskId: 'task-uuid',
  userName: 'John Doe'
});
```

**Listen User Typing:**
```javascript
socket.on('user-typing', (data) => {
  // Show typing indicator
});
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "No token provided" | "Invalid token"
}
```

**403 Forbidden:**
```json
{
  "error": "Access denied"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```
