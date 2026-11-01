import { createFirebaseBackend } from './firebase';
import { localBackend } from './local';
import type { Backend } from './types';

const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const hasFirebase = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain);

export const backend: Backend = hasFirebase
  ? createFirebaseBackend(firebaseConfig as Record<string, string>)
  : localBackend;

export type { Backend };
