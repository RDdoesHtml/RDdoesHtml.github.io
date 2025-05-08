import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2eQE3kYjwVl-2OkxAG2c0N80R8Lw7VSg",
  authDomain: "auth-3a3bc.firebaseapp.com",
  projectId: "auth-3a3bc",
  storageBucket: "auth-3a3bc.firebasestorage.app",
  messagingSenderId: "365653812671",
  appId: "1:365653812671:web:26bc3d5c22b6b48b1fad0a",
  measurementId: "G-BHHRX4ST95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;

// Only initialize analytics on client side
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');

// Sign in with Google using popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign in successful:", result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign in with Microsoft using popup
export const signInWithMicrosoft = async () => {
  try {
    // Configure Microsoft provider
    microsoftProvider.setCustomParameters({
      // Force re-consent
      prompt: 'consent',
      // Target specific email with login hint
      login_hint: ''
    });
    
    const result = await signInWithPopup(auth, microsoftProvider);
    console.log("Microsoft sign in successful:", result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Microsoft:", error);
    throw error;
  }
};

// Handle redirect result (for mobile devices)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect result successful:", result.user);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect:", error);
    throw error;
  }
};
