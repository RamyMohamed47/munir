# Munir Codebase Context

Last reviewed: 2026-06-09

## Purpose

Munir is an Express/Mongoose backend for positive daily quotes and motivational phrases. The current codebase is API-only and uses ES modules (`"type": "module"`).

## Runtime Shape

- `server.js` loads `config.env`, connects Mongoose using `DATABASE` and `DATABASE_PASSWORD`, imports `app.js`, then starts the HTTP server.
- `app.js` creates the Express app, applies security/logging/body parsing middleware, mounts API routers, installs the 404 handler, then installs the global error handler.
- API responses generally follow the existing Natours-style shape:

```json
{
  "status": "success",
  "results": 0,
  "data": {
    "data": []
  }
}
```

## Main Modules

- `models/userModel.js`: Mongoose `User` model with `name`, `email`, `role`, and `firebaseUid`, with email validation via `validator.isEmail`.
- `models/messageModel.js`: Mongoose `Message` model with `message`, `time`, `state`, `user`, `likes`, and unique numeric `shownMessageIndex`.
- `controllers/handlerFactory.js`: Generic CRUD factory helpers: `createOne`, `getOne`, `getAll`, `updateOne`, `deleteOne`.
- `controllers/messageController.js`: Custom message endpoint logic. `getMessages` reads `req.body.SMI`, validates it as an array of finite numbers, finds messages with matching `shownMessageIndex`, populates referenced `user` with `name`, and returns the matched documents.
- `controllers/userController.js`: Thin wrappers around the factory helpers for user CRUD plus `getMe`, which returns the authenticated Mongo user in `data.data`.
- `controllers/authController.js`: Exports `protect` and `restrictTo(...roles)`. `protect` verifies Bearer Firebase ID tokens, syncs the Mongo user, and attaches the Mongo document to `req.user`.
- `controllers/errorController.js`: Global Express error handler. It has separate development and production response paths.
- `utils/catchAsync.js`: Wraps async Express handlers and forwards rejections to `next`.
- `utils/appError.js`: Operational error class with `statusCode`, `status`, and `isOperational`.
- `utils/firebaseAdmin.js`: Lazily initializes Firebase Admin from `FIREBASE_SERVICE_ACCOUNT_PATH` and exposes `getFirebaseAuth()`.
- `utils/apiFeatures.js`: Query helper for filtering, sorting, field limiting, and pagination.
- `utils/logger.js` and `utils/requestLogger.js`: Pino logger setup with request IDs and redaction.

## Routes

- `GET /api/v1/messages`
  - Handler: `messageController.getMessages`
  - Body: `{ "SMI": [1, 2, 3] }`
  - Query behavior: `Message.find({ shownMessageIndex: { $in: SMI } }).populate('user', 'name')`
  - Response: matched messages in MongoDB query order, not request order.
  - Missing `shownMessageIndex` values are skipped.

- `GET /api/v1/users/me`
  - Handler: `authController.protect` then `userController.getMe`
  - Header: `Authorization: Bearer <Firebase ID token>`
  - Behavior: verifies the Firebase token, upserts the matching Mongo user by `firebaseUid`, and returns the synced Mongo document.

- `/api/v1/users`
  - Router currently exposes the protected `/me` endpoint only.

## Data Relationships

- `Message.user` is an ObjectId reference to `User`.
- Message responses currently populate `user` with only the `name` field.
- `shownMessageIndex` is unique and required on `Message`; it is used by the message retrieval API.

## Testing

- The focused tests are `tests/authController.test.js`, `tests/userRoutes.test.js`, and `tests/messageController.test.js`.
- `authController.test.js` mocks Firebase Admin and the `User` model to verify Bearer token validation, Mongo upsert, missing profile data, and duplicate-email conflict handling.
- `userRoutes.test.js` mounts the router in a minimal Express app to verify `GET /api/v1/users/me`.
- `messageController.test.js` mocks the `Message` model and verifies that `getMessages` queries with `$in`, populates `user` with `name`, and returns the expected JSON response.
- The direct command that passed during review was:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/authController.test.js tests/userRoutes.test.js tests/messageController.test.js --runInBand
```

## Agent Maintenance Rule

When future changes affect routes, models, controller behavior, response shapes, environment assumptions, or test commands, update this file in the same change. Keep it factual and short; prefer current behavior over intended future behavior.
