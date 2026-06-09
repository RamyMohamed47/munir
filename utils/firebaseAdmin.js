import fs from 'fs';
import path from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import AppError from './appError.js';

let firebaseAuth;

const loadServiceAccount = () => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new AppError(
      'FIREBASE_SERVICE_ACCOUNT_PATH is not configured',
      500,
    );
  }

  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new AppError(
      `Firebase service account file not found at ${serviceAccountPath}`,
      500,
    );
  }

  const rawServiceAccount = fs.readFileSync(resolvedPath, 'utf8');
  const serviceAccount = JSON.parse(rawServiceAccount);

  return {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
  };
};

export const getFirebaseAuth = () => {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  const apps = getApps();
  const firebaseApp = apps.length
    ? apps[0]
    : initializeApp({
        credential: cert(loadServiceAccount()),
      });

  firebaseAuth = getAuth(firebaseApp);
  return firebaseAuth;
};
