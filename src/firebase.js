import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjEaD4mt2hs726F7cvDCeTtrNCkFdiCkE",
  authDomain: "dokihub-3d9ed.firebaseapp.com",
  projectId: "dokihub-3d9ed",
  storageBucket: "dokihub-3d9ed.firebasestorage.app",
  messagingSenderId: "525036932494",
  appId: "1:525036932494:web:b282b9759b80fe6589a8df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Firestore helpers ─────────────────────────────────────────────────────
// All shared data lives in a single Firestore document: dokihub/state
// This keeps reads/writes simple and within free-tier limits.

const STATE_DOC = doc(db, "dokihub", "state");

/**
 * Save a specific key to the shared Firestore state document.
 * Uses merge so other keys aren't overwritten.
 */
export async function fbSave(key, value) {
  try {
    await setDoc(STATE_DOC, { [key]: JSON.parse(JSON.stringify(value)) }, { merge: true });
  } catch (err) {
    console.error(`[Firebase] Save failed for "${key}":`, err);
  }
}

/**
 * Subscribe to real-time changes on the shared state document.
 * Calls `callback(data)` whenever any team member makes a change.
 * Returns an unsubscribe function.
 */
export function fbListen(callback) {
  return onSnapshot(STATE_DOC, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  }, (err) => {
    console.error("[Firebase] Listen error:", err);
  });
}

export { db };
