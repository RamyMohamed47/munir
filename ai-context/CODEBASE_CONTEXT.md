# Munir Codebase Context

Last reviewed: 2026-08-28

## Purpose

Munir is an Express/Mongoose backend for positive daily quotes and motivational phrases. The current codebase is API-only and uses ES modules (`"type": "module"`).

## Runtime Shape

- `server.js` loads `config.env`, connects Mongoose using `DATABASE` and `DATABASE_PASSWORD`, imports `app.js`, starts the HTTP server, then starts enabled background jobs after Mongo connects.
- `.env.example` documents the required local environment shape without carrying real secrets.
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
- `controllers/messageController.js`: Contains scheduled-message selection, simple user-scoped message listing, and admin message CRUD handlers.
- `controllers/userController.js`: Thin wrappers around the factory helpers for user CRUD plus `getMe`, user statistics, and self-or-admin access control for nested user message routes.
- `controllers/authController.js`: Exports `protect` and `restrictTo(...roles)`. `protect` verifies Bearer Firebase ID tokens, syncs the Mongo user, and attaches the Mongo document to `req.user`.
- `controllers/errorController.js`: Global Express error handler. It has separate development and production response paths.
- `utils/catchAsync.js`: Wraps async Express handlers and forwards rejections to `next`.
- `utils/appError.js`: Operational error class with `statusCode`, `status`, and `isOperational`.
- `utils/firebaseAdmin.js`: Lazily initializes Firebase Admin from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, then exposes `getFirebaseAuth()`.
- `jobs/rejectedMessagesCleanupJob.js`: `node-cron` background cleanup for permanently deleting `Rejected` messages every Friday at 00:00 UTC when `ENABLE_SCHEDULED_JOBS=true`.
- `app.js` uses `express-mongo-sanitize` and `xss-clean` without their default middleware wrappers because those wrappers reassign `req.query` and break on Express 5. Body input is sanitized globally; query filter sanitization happens inside `utils/apiFeatures.js`.
- `utils/apiFeatures.js`: Query helper for filtering, sorting, field limiting, and pagination. It sanitizes query filters before passing them into Mongo.
- `utils/logger.js` and `utils/requestLogger.js`: Pino logger setup with request IDs and redaction.
- `docs/openapi.js`: OpenAPI 3.0 definition for the implemented API, served through Swagger UI by `app.js`.
- `scripts/exportOpenApi.js`: Generates the portable `docs/openapi.json` contract from `docs/openapi.js`; run it with `npm run docs:export` after API contract changes.

## Routes

- `GET /api-docs`: interactive Swagger UI for the API contract.
- `GET /api-docs.json`: machine-readable OpenAPI document suitable for import or client generation.

- `POST /api/v1/messages/scheduled-messages`
  - Handler: `authController.protect` then `messageController.getScheduledMessage`
  - Body: `{ "SMI": [1, 2, 3] }`
  - Header: `Authorization: Bearer <Firebase ID token>`
  - Behavior: returns one random `Approved` message whose `shownMessageIndex` is not in the provided array.

- `GET /api/v1/messages`
  - Handler: `authController.protect`, `authController.restrictTo('admin')`, then `messageController.getAllMessages`
  - Behavior: admin-only list endpoint using `APIFeatures`.

- `POST /api/v1/messages`
  - Handler: `authController.protect`, `authController.restrictTo('admin')`, `messageController.setCurrentUserAsMessageUser`, then `messageController.createMessage`
  - Behavior: admin-only create endpoint; the message `user` is forced to the authenticated admin user id.

- `PATCH /api/v1/messages/:id`
  - Handler: `authController.protect`, `authController.restrictTo('admin')`, then `messageController.updateMessage`

- `DELETE /api/v1/messages/:id`
  - Handler: `authController.protect`, `authController.restrictTo('admin')`, then `messageController.deleteMessage`

- `GET /api/v1/users/me`
  - Handler: `authController.protect` then `userController.getMe`
  - Header: `Authorization: Bearer <Firebase ID token>`
  - Behavior: verifies the Firebase token, upserts the matching Mongo user by `firebaseUid`, and returns the synced Mongo document.

- `/api/v1/users`
  - `GET /api/v1/users`: admin-only list endpoint using `APIFeatures`.
  - `GET /api/v1/users/statistics`: admin-only aggregate counts for users, messages, messages by state, and total likes.
  - `DELETE /api/v1/users/:id`: admin-only delete endpoint.
  - `GET /api/v1/users/:id/messages`: protected nested route; requester must be that user or an admin. Returns that user's messages directly without `APIFeatures`.
  - `GET /api/v1/users/me`: protected current-user endpoint.

## Data Relationships

- `Message.user` is an ObjectId reference to `User`.
- Message responses currently populate `user` with only the `name` field.
- `shownMessageIndex` is unique and required on `Message`; scheduled-message selection excludes previously shown indexes with `SMI`.

## Testing

- The focused tests are `tests/authController.test.js`, `tests/userRoutes.test.js`, and `tests/messageController.test.js`.
- `authController.test.js` mocks Firebase Admin and the `User` model to verify Bearer token validation, Mongo upsert, missing profile data, and duplicate-email conflict handling. As of this review, it does not match the current `authController.js` payload shape because the controller reads `user_id` and `role`.
- `userRoutes.test.js` mounts the router in a minimal Express app to verify `GET /api/v1/users/me`.
- `messageController.test.js` mocks the `Message` model and verifies scheduled-message selection behavior.
- `messageRoutes.test.js` verifies message route protection and static route wiring.
- `statisticsController.test.js` verifies the statistics response shape from aggregate counts through `userController.getStatistics`.
- `rejectedMessagesCleanupJob.test.js` verifies rejected-message deletion, node-cron schedule/options, disabled-job behavior, scheduled callback execution, and failure logging.
- `swaggerDocs.test.js` verifies the raw OpenAPI route, implemented path coverage, Firebase Bearer scheme, Swagger UI route, and that `docs/openapi.json` matches the application spec.
- The cleanup-job command that passed during review was:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/rejectedMessagesCleanupJob.test.js --runInBand
```

## Agent Maintenance Rule

When future changes affect routes, models, controller behavior, response shapes, environment assumptions, or test commands, update this file in the same change. Keep it factual and short; prefer current behavior over intended future behavior.
