import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      let credentialData;
      if (process.env.NODE_ENV === "production") {
        // 本番環境: Base64 エンコードされた環境変数から取得
        const base64Key = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
        if (!base64Key) {
          throw new Error("GCP_SERVICE_ACCOUNT_KEY_BASE64 is not set");
        }

        // Base64 デコードして JSON オブジェクトに変換
        const jsonKey = Buffer.from(base64Key, "base64").toString("utf-8");
        credentialData = JSON.parse(jsonKey);
      } else {
        // 開発環境: ローカルの .env に設定したパス（または直接のJSON）を使用
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!serviceAccountPath) {
          throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set in .env.local");
        }

        credentialData = serviceAccountPath; // ファイルパスをそのまま渡す
      }
      initializeApp({
        credential: cert(credentialData),
      });

      const adminDbInstance = getFirestore();
      adminDbInstance.settings({
        ignoreUndefinedProperties: true,
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
