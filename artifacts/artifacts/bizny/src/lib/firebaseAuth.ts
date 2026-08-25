import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0971401176",
  appId: "1:1604678816:web:393a463f65b9033b2b05c5",
  apiKey: "AIzaSyDrFLWTGFENKV2VPbeMi6c6kihnECujkLY",
  authDomain: "gen-lang-client-0971401176.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-biznywebapp-b56a9990-4726-4265-a301-97e478b14236",
  storageBucket: "gen-lang-client-0971401176.firebasestorage.app",
  messagingSenderId: "1604678816",
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.error("Firebase auth initialization error:", err);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export interface GoogleAuthResult {
  token: string;
  user: any;
  isNewUser: boolean;
}

/**
 * Initiates Google Sign In / Sign Up popup and synchronizes with Bizny backend.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (!auth) {
    throw new Error("Firebase Authentication is not initialized.");
  }

  try {
    const cred: UserCredential = await signInWithPopup(auth, googleProvider);
    const gUser = cred.user;

    if (!gUser.email) {
      throw new Error("Could not retrieve email from Google Account.");
    }

    const idToken = await gUser.getIdToken().catch(() => "");

    // Send Google credentials to backend
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: gUser.email,
        name: gUser.displayName || "",
        avatarUrl: gUser.photoURL || "",
        googleUid: gUser.uid,
        idToken,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: "Authentication failed" }));
      throw new Error(errBody.error || `Authentication failed (Status ${res.status})`);
    }

    const data: GoogleAuthResult = await res.json();
    return data;
  } catch (error: any) {
    if (error.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domain unauthorized in Firebase Auth. This environment's origin (" +
          (typeof window !== "undefined" ? window.location.hostname : "preview domain") +
          ") must be added to Firebase Console > Authentication > Settings > Authorized Domains. Please use manual email registration/login in the meantime."
      );
    }
    if (error.code === "auth/popup-blocked") {
      throw new Error("Popup blocked by browser. Please allow popups or open the app in a new tab.");
    }
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      throw new Error("Google sign-in was cancelled.");
    }
    if (error.code === "auth/network-request-failed") {
      throw new Error("Network connection error during Google sign-in.");
    }
    throw error;
  }
}
