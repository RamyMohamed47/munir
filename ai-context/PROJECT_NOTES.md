# Munir Project Notes

Last reviewed: 2026-06-09

## Current Review Findings

- `controllers/authController.js` now owns Firebase token verification and Mongo user sync. Any future auth route should reuse `protect` instead of reimplementing token parsing.
- `utils/firebaseAdmin.js` expects `FIREBASE_SERVICE_ACCOUNT_PATH` to point at the ignored service account JSON inside `config/`.
- `routes/userRoutes.js` exposes protected `GET /api/v1/users/me`. Client applications are expected to handle Firebase login/signup and send Bearer ID tokens to the backend.
- `routes/messageRoutes.js` still keeps message retrieval public. Protect it later only if the product decision changes.
- `controllers/messageController.js` still relies on `req.body.SMI` for the message selection API and populates the referenced user name.
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

- Run the focused auth, route, and message controller tests:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/authController.test.js tests/userRoutes.test.js tests/messageController.test.js --runInBand
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
- `config/` is ignored by git so the Firebase admin service account JSON stays out of source control.
- `FIREBASE_SERVICE_ACCOUNT_PATH` should point at the service account JSON when running auth-backed routes or tests that exercise Firebase Admin.
- Logging writes to `logs/app.log` unless log level is silent.
- In test environments, logger level becomes `silent` when `NODE_ENV=test` or `JEST_WORKER_ID` is set.

## Documentation Maintenance

Future agents should update:

- `ai-context/CODEBASE_CONTEXT.md` when behavior, architecture, data shape, endpoints, or test strategy changes.
- `ai-context/PROJECT_NOTES.md` when known issues are fixed, new risks are found, commands change, or environment assumptions change.

Do not let these files become aspirational. They should describe what is true in the repo at the time of the change.
