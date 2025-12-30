import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // For development, use service account JSON file
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!serviceAccountPath) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set");
      }

      initializeApp({
        credential: cert(serviceAccountPath),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
      throw error;
    }
  }
}

let adminDbInstance: FirebaseFirestore.Firestore | null = null;

export const adminDb = () => {
  if (!adminDbInstance) {
    initializeFirebaseAdmin();
    adminDbInstance = getFirestore();
  }
  return adminDbInstance;
};

export default adminDb;
