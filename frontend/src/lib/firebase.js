import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const firebaseLogin = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const firebaseRegister = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
};

export const firebaseGoogleLogin = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const firebaseLogout = async () => {
  await signOut(auth);
};

export { auth };
