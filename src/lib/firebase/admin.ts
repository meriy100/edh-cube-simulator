import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ExternalAccountClient } from "google-auth-library";

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      if (process.env.NODE_ENV === "production") {
        // 1. WIF の設定情報を定義（Terraform で作成した値を使用）
        const wifConfig = {
          type: "external_account",
          audience: `//iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${process.env.GCP_WIP_ID}/providers/${process.env.GCP_WIP_PROVIDER_ID}`,
          subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
          token_url: "https://sts.googleapis.com/v1/token",
          service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${process.env.GCP_SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
          credential_source: {
            url: "https://oidc.vercel.com/", // Vercel の OIDC エンドポイント
            headers: {
              Authorization: `Bearer ${process.env.VERCEL_OIDC_TOKEN}`,
            },
          },
        };

        // 2. Google Auth Library を使って認証クライアントを作成
        // ※ ExternalAccountClient は環境変数からではなく、直接オブジェクトを渡せます
        const authClient = ExternalAccountClient.fromJSON(wifConfig);

        if (!authClient) {
          throw new Error("Failed to create ExternalAccountClient");
        }

        // 3. Firebase Admin SDK の初期化
        if (getApps().length === 0) {
          initializeApp({
            credential: cert(authClient as never),
            projectId: process.env.GCP_PROJECT_ID,
          });
        }
      } else {
        // For development, use service account JSON file
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        if (!serviceAccountPath) {
          throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set");
        }

        initializeApp({
          credential: cert(serviceAccountPath),
        });
      }
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
