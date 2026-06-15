/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Provider with the approved userinfo scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('openid');

// Configure Microsoft Provider
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  prompt: 'consent',
});

/**
 * Triggers Google Sign-In with a popup window.
 * This runs securely in the browser context.
 */
export const googleSignIn = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (error && error.code === 'auth/popup-closed-by-user') {
      console.warn('Google Sign-In popup closed by user.');
    } else {
      console.error('Error during Google Sign-In with popup:', error);
    }
    throw error;
  }
};

/**
 * Triggers Microsoft Sign-In with a popup window.
 * This runs securely in the browser context.
 */
export const microsoftSignIn = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    return result.user;
  } catch (error: any) {
    if (error && error.code === 'auth/operation-not-allowed') {
      console.log('Microsoft auth provider is currently not enabled in this Firebase project\'s configuration. Showing instructions and demo login instead.');
    } else if (error && error.code === 'auth/popup-closed-by-user') {
      console.warn('Microsoft Sign-In popup closed by user.');
    } else {
      console.error('Error during Microsoft Sign-In with popup:', error);
    }
    throw error;
  }
};

/**
 * Signs out the current user from Firebase Auth.
 */
export const firebaseSignOut = async (): Promise<void> => {
  await signOut(auth);
};
