import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  type Firestore,
} from "firebase/firestore";
import fs from "fs";
import path from "path";

function loadFirebaseConfig() {
  try {
    if (process.env.FIREBASE_CONFIG_JSON) {
      return JSON.parse(process.env.FIREBASE_CONFIG_JSON);
    }
    const baseDir = typeof import.meta !== "undefined" && import.meta.dirname
      ? import.meta.dirname
      : (typeof __dirname !== "undefined" ? __dirname : process.cwd());
    const possiblePaths = [
      path.resolve(process.cwd(), "firebase-applet-config.json"),
      path.resolve(process.cwd(), "../../firebase-applet-config.json"),
      path.resolve(process.cwd(), "../../../firebase-applet-config.json"),
      path.resolve(baseDir, "firebase-applet-config.json"),
      path.resolve(baseDir, "../firebase-applet-config.json"),
      path.resolve(baseDir, "../../firebase-applet-config.json"),
      path.resolve(baseDir, "../../../firebase-applet-config.json"),
      path.resolve(baseDir, "../../../../firebase-applet-config.json"),
    ];
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, "utf-8"));
      }
    }
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
      return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        apiKey: process.env.FIREBASE_API_KEY,
        appId: process.env.FIREBASE_APP_ID || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "(default)",
      };
    }
  } catch (err) {
    console.error("Failed to load firebase config:", err);
  }
  return null;
}

const config = loadFirebaseConfig();
let dbFirestore: Firestore | null = null;

if (config) {
  try {
    const apps = getApps();
    const app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(config);
    const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
      ? config.firestoreDatabaseId
      : undefined;
    dbFirestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    console.log(`[Firestore] Initialized Firestore with project: ${config.projectId}, db: ${databaseId || "(default)"}`);
  } catch (err) {
    console.error("[Firestore] Initialization error:", err);
  }
}

export { dbFirestore };

// Save Research Submission to Firestore
export async function saveResearchToFirestore(record: Record<string, any>): Promise<void> {
  if (!dbFirestore) return;
  try {
    const subRef = doc(collection(dbFirestore, "researchSubmissions"), record.submissionId);
    await setDoc(subRef, {
      ...record,
      createdAt: new Date().toISOString(),
    });
    console.log(`[Firestore] Saved research submission: ${record.submissionId}`);
  } catch (err) {
    console.error("[Firestore] Failed to save research submission:", err);
  }
}

// Get Research Submissions from Firestore
export async function getResearchFromFirestore(limitCount = 200): Promise<any[]> {
  if (!dbFirestore) return [];
  try {
    const q = query(collection(dbFirestore, "researchSubmissions"), orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (err) {
    console.error("[Firestore] Failed to fetch research submissions:", err);
    return [];
  }
}

// Save User Account to Firestore
export async function saveUserToFirestore(user: Record<string, any>): Promise<void> {
  if (!dbFirestore) return;
  try {
    const docId = user.id ? String(user.id) : (user.email ? user.email.replace(/[@.]/g, "_") : "user_" + Date.now());
    const userRef = doc(collection(dbFirestore, "users"), docId);
    await setDoc(userRef, {
      ...user,
      createdAt: user.createdAt || new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firestore] Saved user account to Firestore: ${docId}`);
  } catch (err) {
    console.error("[Firestore] Failed to save user to Firestore:", err);
  }
}

// Get User Account from Firestore
export async function getUserFromFirestoreByEmail(email: string): Promise<any | null> {
  if (!dbFirestore) return null;
  try {
    const q = query(collection(dbFirestore, "users"), limit(50));
    const snap = await getDocs(q);
    const docMatch = snap.docs.find((d) => d.data().email === email);
    return docMatch ? docMatch.data() : null;
  } catch (err) {
    console.error("[Firestore] Failed to fetch user by email:", err);
    return null;
  }
}

// Get All Users from Firestore
export async function getAllUsersFromFirestore(limitCount = 500): Promise<any[]> {
  if (!dbFirestore) return [];
  try {
    const q = query(collection(dbFirestore, "users"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (err) {
    console.error("[Firestore] Failed to fetch all users from Firestore:", err);
    return [];
  }
}

// Delete Research Submission from Firestore
export async function deleteResearchFromFirestore(submissionId: string): Promise<boolean> {
  if (!dbFirestore) return false;
  try {
    const { deleteDoc } = await import("firebase/firestore");
    const subRef = doc(collection(dbFirestore, "researchSubmissions"), submissionId);
    await deleteDoc(subRef);
    console.log(`[Firestore] Deleted research submission: ${submissionId}`);
    return true;
  } catch (err) {
    console.error("[Firestore] Failed to delete research submission:", err);
    return false;
  }
}
