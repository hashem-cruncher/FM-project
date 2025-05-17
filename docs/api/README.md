# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Register User
```http
POST /auth/register
```

Request body:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "created_at": "string"
    },
    "token": "string"
  }
}
```

### Login
```http
POST /auth/login
```

Request body:
```json
{
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "streak_days": "integer",
      "total_stars": "integer",
      "completed_lessons": "integer"
    },
    "token": "string"
  }
}
```

## User Management

### Get User Profile
```http
GET /users/{id}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "nickname": "string",
      "streak_days": "integer",
      "total_stars": "integer",
      "completed_lessons": "integer",
      "created_at": "string"
    }
  }
}
```

### Update User Profile
```http
PUT /users/{id}
```

Request body:
```json
{
  "nickname": "string",
  "email": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "nickname": "string",
      "updated_at": "string"
    }
  }
}
```

### Get User Preferences
```http
GET /users/{id}/preferences
```

Response:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "sound_enabled": "boolean",
      "notifications_enabled": "boolean",
      "theme": "string",
      "language": "string"
    }
  }
}
```

### Update User Preferences
```http
PUT /users/{id}/preferences
```

Request body:
```json
{
  "sound_enabled": "boolean",
  "notifications_enabled": "boolean",
  "theme": "string",
  "language": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "sound_enabled": "boolean",
      "notifications_enabled": "boolean",
      "theme": "string",
      "language": "string",
      "updated_at": "string"
    }
  }
}
```

## Learning Progress

### Get User Progress
```http
GET /progress/user/{id}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "level_id": "integer",
      "progress": "integer",
      "completed": "boolean",
      "completed_at": "string",
      "learned_items": "object"
    }
  ]
}
```

### Update Progress
```http
POST /progress/update
```

Request body:
```json
{
  "user_id": "integer",
  "level_id": "integer",
  "progress": "integer",
  "completed": "boolean",
  "unlock_next_level": "boolean",
  "learned_items": "object"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "progress": {
      "level_id": "integer",
      "progress": "integer",
      "completed": "boolean",
      "completed_at": "string"
    },
    "user": {
      "id": "integer",
      "completed_lessons": "integer",
      "total_stars": "integer"
    }
  }
}
```

## Learning Content

### Get Learning Levels
```http
GET /learning/levels
```

Query Parameters:
- `user_id`: integer (optional) - Include user progress

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "title": "string",
      "description": "string",
      "order": "integer",
      "icon_name": "string",
      "color_class": "string",
      "progress": "integer",
      "is_locked": "boolean"
    }
  ]
}
```

### Get Level Content
```http
GET /learning/levels/{id}/content
```

Response:
```json
{
  "success": true,
  "data": {
    "level": {
      "id": "integer",
      "title": "string",
      "content": "object"
    }
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired token"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "Resource not found"
  }
}
```

## Authentication

All API endpoints except `/auth/login` and `/auth/register` require authentication.

Include the JWT token in the Authorization header:
```http
Authorization: Bearer <token>
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1628789000
```

## Pagination

For endpoints that return lists, use query parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": "integer",
    "per_page": "integer",
    "total_pages": "integer",
    "total_items": "integer"
  }
}
```

## Examples

### Complete Learning Level
```http
POST /progress/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "level_id": 2,
  "progress": 100,
  "completed": true,
  "unlock_next_level": true,
  "learned_items": {
    "0": 100,
    "1": 100,
    "2": 100
  }
}
```

### Update User Profile with Preferences
```http
PUT /users/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "New Nickname",
  "email": "new@email.com",
  "preferences": {
    "sound_enabled": true,
    "notifications_enabled": false
  }
}
```

## WebSocket Events

### Progress Update
```json
{
  "type": "progress_update",
  "data": {
    "user_id": "integer",
    "level_id": "integer",
    "progress": "integer"
  }
}
```

### Achievement Unlocked
```json
{
  "type": "achievement_unlocked",
  "data": {
    "user_id": "integer",
    "achievement_id": "integer",
    "title": "string",
    "description": "string"
  }
}
```

## Development Guidelines

1. Use appropriate HTTP methods
2. Return consistent response formats
3. Include proper error handling
4. Validate request data
5. Use meaningful status codes
6. Document all changes

For more details, see the [Backend Documentation](../backend/README.md). 