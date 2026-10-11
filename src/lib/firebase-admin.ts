import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const useFirebaseEmulators = process.env.NODE_ENV === "development" &&
  process.env.FIREBASE_USE_EMULATORS === "true";

if (!useFirebaseEmulators && (!projectId || !clientEmail || !privateKey)) {
  throw new Error(
    "Missing Firebase Admin environment variables."
  );
}

if (useFirebaseEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
}

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : useFirebaseEmulators
      ? initializeApp({ projectId: projectId || "e-barangay-system-427d0" })
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey!.replace(/\\n/g, "\n"),
          }),
        });

export const adminDb =
  getFirestore(firebaseAdminApp);

export const adminMessaging =
  getMessaging(firebaseAdminApp);

export const adminAuth = getAuth(firebaseAdminApp);

export default firebaseAdminApp;
