This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin account setup

Admin registration uses the Firebase Admin SDK on the server. Configure these
server-only environment variables in `.env.local` for local development and
in the Vercel project settings for deployments:

```text
ADMIN_ACCESS_PIN=choose-a-private-staff-pin
FIREBASE_ADMIN_PROJECT_ID=e-barangay-system-427d0
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@e-barangay-system-427d0.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The client email and private key must come from a Firebase service-account key.
Do not commit `.env.local`, service-account JSON files, or private keys. After
setting the variables in Vercel, redeploy before using `/staff-access` and
`/admin/signup`.

## Local Firebase Emulators

Emulator mode is opt-in and only activates when `NODE_ENV` is `development`.
The browser Firebase SDK and server-side Firebase Admin SDK then use Auth on
port `9099` and Firestore on port `8080`.

Start the emulators in one CMD window:

```cmd
cd C:\Users\chiel\barangay-services-system
npm run emulators
```

Start Next.js in a second CMD window with emulator mode explicitly enabled:

```cmd
cd C:\Users\chiel\barangay-services-system
set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
set FIREBASE_USE_EMULATORS=true
set ADMIN_ACCESS_PIN=local-test-pin
set FIREBASE_ADMIN_PROJECT_ID=e-barangay-system-427d0
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
npm run dev
```

These flags are process-local. Do not add them to deployment settings. With
the flags absent, the application keeps its normal Firebase configuration and
does not connect to localhost.

For an emulator-only admin account, open `/staff-access`, use a local test
staff PIN, and complete `/admin/signup`. The account and trusted
`adminProfiles` record are then created in the emulator. Sign in at
`/admin/login`, add test residents through `/admin/residents`, and only then
run **Prepare Verification**. This workflow does not use production data.

Firestore rules and indexes continue to come from the root
`firestore.rules` and `firestore.indexes.json` files. The emulator UI is not
enabled by this configuration.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
