// src/libs/firebase-admin.ts
import { initializeApp as initializeAdminApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  throw new Error('Missing Firebase Admin environment variables');
}

const adminConfig = {
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
};

import { Auth } from 'firebase-admin/auth';

let adminApp;
let adminAuth;

try {
  adminApp = getApps().length === 0 ? initializeAdminApp(adminConfig) : getApp();
  adminAuth = getAdminAuth(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error('Failed to initialize Firebase Admin: ' + errorMessage);
}

export { adminAuth, adminApp };