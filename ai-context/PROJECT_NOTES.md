# Munir Project Notes

Last reviewed: 2026-06-10

## Current Review Findings

- `controllers/authController.js` now owns Firebase token verification and Mongo user sync. Any future auth route should reuse `protect` instead of reimplementing token parsing.
- `utils/firebaseAdmin.js` expects `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` to be present in environment variables.
- `.env.example` now exists as the shareable placeholder file for local setup; real secrets stay in `config.env` or deployment secret storage.
- `routes/userRoutes.js` now exposes admin-only user list/delete, admin-only `/statistics`, protected `/me`, and protected nested `/:id/messages` with self-or-admin access control.
- `routes/messageRoutes.js` protects `scheduled-messages` for logged-in users and keeps admin-only root CRUD routes.
- `controllers/messageController.js` uses `req.body.SMI` only for scheduled-message exclusion.
- `controllers/errorController.js` only sends responses when `NODE_ENV` is exactly `development` or `production`; another value may leave errors without a response.
- `models/userModel.js` must import `validator` as a default import in this runtime; the package does not expose `isEmail` as a named ESM export here.
- `utils/apiFeatures.js` defaults sorting to `-createdAt`, but the current schemas do not define timestamps or `createdAt`.
- `utils/logger.js` has `base.service` set to `natours`, which appears copied from an older project name.
- `package.json` uses Jest project selectors (`--selectProjects unit integration`), but no Jest project config file was found in the repo during review.

## Local Commands

- Start the API:

```powershell
npm start
```

- Run the focused auth, route, message, and statistics tests:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/authController.test.js tests/userRoutes.test.js tests/messageController.test.js tests/messageRoutes.test.js tests/statisticsController.test.js --runInBand
```

- Package scripts currently present:

```powershell
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm start
npm run start:prod
```

## Environment Assumptions

- `server.js` expects `config.env` to provide `DATABASE` and `DATABASE_PASSWORD`.
- `DATABASE` must include `<PASSWORD>` because `server.js` calls `.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)`.
- `config/` is still ignored by git, but Firebase Admin now reads credentials from environment variables instead of a runtime JSON file.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` must be present when running auth-backed routes outside mocked tests.
- Logging writes to `logs/app.log` unless log level is silent.
- In test environments, logger level becomes `silent` when `NODE_ENV=test` or `JEST_WORKER_ID` is set.

## Documentation Maintenance

Future agents should update:

- `ai-context/CODEBASE_CONTEXT.md` when behavior, architecture, data shape, endpoints, or test strategy changes.
- `ai-context/PROJECT_NOTES.md` when known issues are fixed, new risks are found, commands change, or environment assumptions change.

Do not let these files become aspirational. They should describe what is true in the repo at the time of the change.
