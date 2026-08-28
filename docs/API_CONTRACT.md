# Munir API Contract

This document describes the HTTP API consumed by the Munir Flutter client.

## Base Contract

```text
Base URL: http://<server-host>/api/v1
Content-Type: application/json
Authorization: Bearer <Firebase ID token>
```

The Flutter app authenticates users with Firebase. For protected backend endpoints, send the Firebase ID token in the `Authorization` header.

Current backend token sync expects these Firebase token claims:

- `user_id`
- `email`
- `name`
- `role`

Admin endpoints require `role` to be `admin`.

## Response Shapes

Single resource:

```json
{
  "status": "success",
  "data": {
    "data": {}
  }
}
```

List resource:

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "data": []
  }
}
```

Error response:

```json
{
  "status": "fail",
  "message": "Error message"
}
```

## Models

### User

```json
{
  "_id": "66c000000000000000000001",
  "name": "User Name",
  "email": "user@example.com",
  "role": "user",
  "firebaseUid": "firebase-user-id"
}
```

Fields:

- `_id`: MongoDB user id.
- `name`: user display name.
- `email`: unique lowercase email.
- `role`: one of `user`, `admin`, `moderator`.
- `firebaseUid`: unique Firebase user id.

### Message

```json
{
  "_id": "66c000000000000000000101",
  "message": "Keep going.",
  "time": "2026-08-28T00:00:00.000Z",
  "state": "Approved",
  "user": {
    "_id": "66c000000000000000000001",
    "name": "User Name"
  },
  "likes": 0,
  "shownMessageIndex": 12
}
```

Fields:

- `_id`: MongoDB message id.
- `message`: message body, maximum 450 characters.
- `time`: ISO date string.
- `state`: one of `Pending`, `Approved`, `Rejected`.
- `user`: MongoDB user reference. Some responses populate this as `{ _id, name }`.
- `likes`: number of likes.
- `shownMessageIndex`: unique numeric index used by the client to avoid repeated scheduled messages.

## Authentication

### Get Current User

```http
GET /users/me
Authorization: Bearer <Firebase ID token>
```

Access: authenticated user.

Behavior:

- Verifies the Firebase ID token.
- Creates or updates the matching MongoDB user by Firebase uid.
- Returns the synced MongoDB user.

Success response:

```json
{
  "status": "success",
  "data": {
    "data": {
      "_id": "66c000000000000000000001",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "firebaseUid": "firebase-user-id"
    }
  }
}
```

## Messages

### Get Scheduled Message

```http
POST /messages/scheduled-messages
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

Access: authenticated user.

Request body:

```json
{
  "SMI": [1, 2, 3]
}
```

Behavior:

- `SMI` must be an array of numbers.
- Returns one random message with `state: "Approved"`.
- Excludes messages whose `shownMessageIndex` exists in `SMI`.
- Returns `404` when no eligible message is available.

Success response:

```json
{
  "status": "success",
  "data": {
    "data": {
      "_id": "66c000000000000000000101",
      "message": "Keep going.",
      "time": "2026-08-28T00:00:00.000Z",
      "state": "Approved",
      "user": {
        "_id": "66c000000000000000000001",
        "name": "User Name"
      },
      "likes": 0,
      "shownMessageIndex": 12
    }
  }
}
```

Validation errors:

- Missing or non-array `SMI`: `400`.
- Any non-numeric `SMI` item: `400`.

### List All Messages

```http
GET /messages
Authorization: Bearer <Firebase ID token>
```

Access: admin.

Query parameters:

- `page`: page number.
- `limit`: max results per page.
- `sort`: comma-separated fields. Example: `sort=-time`.
- `fields`: comma-separated fields to include.
- Any model field can be used as a filter. Example: `state=Approved`.

Example:

```http
GET /messages?state=Approved&page=1&limit=20&sort=-time
```

Success response:

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "data": [
      {
        "_id": "66c000000000000000000101",
        "message": "Keep going.",
        "time": "2026-08-28T00:00:00.000Z",
        "state": "Approved",
        "user": "66c000000000000000000001",
        "likes": 0,
        "shownMessageIndex": 12
      }
    ]
  }
}
```

### Create Message

```http
POST /messages
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

Access: admin.

Request body:

```json
{
  "message": "Keep going.",
  "state": "Pending",
  "likes": 0,
  "shownMessageIndex": 12
}
```

Notes:

- `message` is required.
- `shownMessageIndex` is required and must be unique.
- `state` defaults to `Pending` when omitted.
- `likes` defaults to `0` when omitted.
- Backend assigns `user` from the authenticated admin.

Success response:

```json
{
  "status": "success",
  "data": {
    "data": {
      "_id": "66c000000000000000000101",
      "message": "Keep going.",
      "time": "2026-08-28T00:00:00.000Z",
      "state": "Pending",
      "user": "66c000000000000000000001",
      "likes": 0,
      "shownMessageIndex": 12
    }
  }
}
```

### Update Message

```http
PATCH /messages/:id
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

Access: admin.

Common request body:

```json
{
  "state": "Approved"
}
```

Success response:

```json
{
  "status": "success",
  "data": {
    "data": {
      "_id": "66c000000000000000000101",
      "message": "Keep going.",
      "time": "2026-08-28T00:00:00.000Z",
      "state": "Approved",
      "user": "66c000000000000000000001",
      "likes": 0,
      "shownMessageIndex": 12
    }
  }
}
```

### Delete Message

```http
DELETE /messages/:id
Authorization: Bearer <Firebase ID token>
```

Access: admin.

Success response:

```text
204 No Content
```

## Users

### List Users

```http
GET /users
Authorization: Bearer <Firebase ID token>
```

Access: admin.

Query parameters:

- `page`: page number.
- `limit`: max results per page.
- `sort`: comma-separated fields.
- `fields`: comma-separated fields to include.
- Any model field can be used as a filter. Example: `role=user`.

Success response:

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "data": [
      {
        "_id": "66c000000000000000000001",
        "name": "User Name",
        "email": "user@example.com",
        "role": "user",
        "firebaseUid": "firebase-user-id"
      }
    ]
  }
}
```

### Get User Messages

```http
GET /users/:id/messages
Authorization: Bearer <Firebase ID token>
```

Access: same user or admin.

Route params:

- `id`: MongoDB user id.

Success response:

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "data": [
      {
        "_id": "66c000000000000000000101",
        "message": "Keep going.",
        "time": "2026-08-28T00:00:00.000Z",
        "state": "Approved",
        "user": {
          "_id": "66c000000000000000000001",
          "name": "User Name"
        },
        "likes": 0,
        "shownMessageIndex": 12
      }
    ]
  }
}
```

### Delete User

```http
DELETE /users/:id
Authorization: Bearer <Firebase ID token>
```

Access: admin.

Success response:

```text
204 No Content
```

### Get Statistics

```http
GET /users/statistics
Authorization: Bearer <Firebase ID token>
```

Access: admin.

Success response:

```json
{
  "status": "success",
  "data": {
    "data": {
      "totalUsers": 10,
      "totalMessages": 50,
      "messagesByState": {
        "Approved": 30,
        "Pending": 15,
        "Rejected": 5
      },
      "totalLikes": 120
    }
  }
}
```

## Common Status Codes

- `200`: successful read or update.
- `201`: resource created.
- `204`: resource deleted.
- `400`: invalid request body, invalid id format, validation error, or incomplete Firebase profile data.
- `401`: missing or invalid Firebase ID token.
- `403`: authenticated user does not have permission.
- `404`: requested document or scheduled message was not found.
- `409`: Firebase-authenticated email conflicts with an existing Mongo user.

## Flutter Integration Notes

- Use Firebase Auth in Flutter to sign in and refresh tokens.
- Send the latest ID token as `Authorization: Bearer <idToken>`.
- Call `GET /users/me` after Firebase login to sync and retrieve the Mongo user id.
- Store `shownMessageIndex` values locally after scheduled messages are shown, then send them in `SMI`.
- Use the Mongo user `_id`, not Firebase uid, when calling `/users/:id/messages`.
