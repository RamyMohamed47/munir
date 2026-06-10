import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import AppError from './appError.js';

let firebaseAuth;

const loadServiceAccount = () => {
  const {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: clientEmail,
    FIREBASE_PRIVATE_KEY: privateKey,
  } = process.env;

  if (!projectId || !clientEmail || !privateKey) {
    throw new AppError(
      'Firebase Admin credentials are not fully configured',
      500,
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
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
