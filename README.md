# Munir Backend

Munir is an API-only Node.js backend for a positive daily messages application. It powers message scheduling, moderation, user synchronization, and admin reporting for a client app that authenticates users through Firebase.

The backend is built with Express, MongoDB, Mongoose, Firebase Admin SDK, and Jest. It keeps authentication delegated to Firebase while storing application-specific user and message data in MongoDB.

## Features

- Firebase ID token verification for protected API routes.
- Automatic MongoDB user synchronization from verified Firebase token claims.
- Role-based access control for admin-only message and user management.
- Scheduled message retrieval that avoids messages already shown to a user.
- User-scoped message history through nested REST routes.
- Admin statistics for users, messages, message states, and total likes.
- Reusable CRUD controller factory with filtering, sorting, field limiting, and pagination.
- Centralized operational error handling and structured request logging with Pino.
- Weekly cleanup job for rejected messages, disabled by default unless explicitly enabled.
- Jest and Supertest coverage for auth, routes, message behavior, statistics, and scheduled jobs.

## Tech Stack

- Runtime: Node.js, Express 5, ES modules
- Database: MongoDB, Mongoose
- Auth: Firebase Admin SDK
- Security and middleware: Helmet, CORS, rate limiting, HPP, Mongo sanitization, XSS body cleaning, compression
- Logging: Pino, pino-http
- Background jobs: node-cron
- Testing: Jest, Supertest, mongodb-memory-server

## Project Structure

```text
controllers/    Request handlers, auth middleware, CRUD factory, error handler
models/         Mongoose schemas for users and messages
routes/         Versioned REST routers for users and messages
utils/          Shared helpers for Firebase Admin, API features, logging, errors
jobs/           Scheduled background jobs
tests/          Unit and route tests
ai-context/     Agent-maintained codebase notes
```

## Authentication Model

The client is responsible for signing users in with Firebase and sending a Firebase ID token to protected backend routes:

```http
Authorization: Bearer <Firebase ID token>
```

`authController.protect` verifies the token with Firebase Admin SDK, requires the needed Firebase profile claims, upserts the Mongo user by `firebaseUid`, and attaches the synced Mongo document to `req.user`.

There are no backend session cookies and no backend login/signup token issuing flow. Firebase owns credential authentication; this API verifies tokens and manages application data.

## API Overview

Interactive Swagger documentation is available at `/api-docs`, and the raw
OpenAPI document is available at `/api-docs.json` while the server is running.
The written Flutter-facing contract is also available in
[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

Generate the portable Swagger file before sharing it or after changing an
endpoint:

```powershell
npm run docs:export
```

The generated [`docs/openapi.json`](docs/openapi.json) can be imported directly
into Swagger Editor, Postman, or OpenAPI client-generation tools.

Base path:

```text
/api/v1
```

### Messages

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/messages/scheduled-messages` | Authenticated user | Returns one random approved message whose `shownMessageIndex` is not in `req.body.SMI`. |
| `GET` | `/messages` | Admin | Lists all messages with filtering, sorting, field limiting, and pagination. |
| `POST` | `/messages` | Admin | Creates a message and assigns it to the authenticated admin user. |
| `PATCH` | `/messages/:id` | Admin | Updates a message, commonly for approval or rejection state changes. |
| `DELETE` | `/messages/:id` | Admin | Deletes a message by Mongo document id. |

Scheduled message request body:

```json
{
  "SMI": [1, 2, 3]
}
```

### Users

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/users/me` | Authenticated user | Returns the current synced Mongo user. |
| `GET` | `/users` | Admin | Lists users with filtering, sorting, field limiting, and pagination. |
| `GET` | `/users/statistics` | Admin | Returns user count, message count, message counts by state, and total likes. |
| `GET` | `/users/:id/messages` | Same user or admin | Lists messages written by the selected user. |
| `DELETE` | `/users/:id` | Admin | Deletes a user by Mongo document id. |

## Data Model

`User`

- `name`
- `email`
- `role`: `user`, `admin`, or `moderator`
- `firebaseUid`

`Message`

- `message`
- `time`
- `state`: `Pending`, `Approved`, or `Rejected`
- `user`: reference to `User`
- `likes`
- `shownMessageIndex`

## Environment Setup

Create a local `config.env` file based on `.env.example`.

Required runtime variables:

```env
PORT=3000
NODE_ENV=development
DATABASE=mongodb://<USERNAME>:<PASSWORD>@<HOST_1>:27017,<HOST_2>:27017,<HOST_3>:27017/<DB>?ssl=true&replicaSet=<REPLICA_SET>&authSource=admin&appName=<APP_NAME>
DATABASE_PASSWORD=replace_me
ENABLE_SCHEDULED_JOBS=false

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nreplace_me\n-----END PRIVATE KEY-----\n"
```

Secrets should stay in `config.env` locally or in the deployment platform's secret manager. Do not commit Firebase service account JSON files or real environment values.

## Running Locally

Install dependencies:

```powershell
npm install
```

Start the API:

```powershell
npm start
```

Production mode:

```powershell
npm run start:prod
```

For deployment installs, omit development and optional dependencies unless Firestore or Firebase Storage support is added later:

```powershell
npm ci --omit=dev --omit=optional
```

## Testing

Focused test command for the current ESM setup:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/authController.test.js tests/userRoutes.test.js tests/messageController.test.js tests/messageRoutes.test.js tests/statisticsController.test.js tests/rejectedMessagesCleanupJob.test.js --runInBand
```

Package scripts are also available:

```powershell
npm test
npm run test:unit
npm run test:integration
```

## Background Jobs

Rejected message cleanup is implemented with `node-cron` in `jobs/rejectedMessagesCleanupJob.js`.

- Schedule: every Friday at `00:00` UTC.
- Behavior: permanently deletes messages with `state: "Rejected"`.
- Toggle: set `ENABLE_SCHEDULED_JOBS=true`.

For multi-instance deployments, enable the scheduler on only one instance unless a distributed locking strategy is added.

## Notes

- The API uses a consistent success response shape:

```json
{
  "status": "success",
  "data": {
    "data": {}
  }
}
```

- `config/`, `config.env`, logs, `node_modules`, and local Postman environments are ignored by Git.
- `ai-context/` contains codebase notes intended to help future agents preserve project context.
