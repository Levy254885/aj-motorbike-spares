# A.J Motorbike Spares & Accessories

**Single-shop** Inventory, POS, and business management PWA.

Currency: **KSh** · Backend: **Firebase Auth + Cloud Firestore only** (no Storage).

## Features

- Login / roles (ADMIN, MANAGER, CASHIER, STOREKEEPER)
- Dashboard with sales analysis (today / 7 days / month, payment methods, inventory value)
- Products & inventory (search, stock status, adjustments)
- POS with stock-safe checkout and receipt numbers `AJ-000001`
- Sales history & profit per sale
- Customers, suppliers, expenses, purchases, stock movements, reports

## Setup (required)

### 1. Firebase project

1. Create project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**
3. Create **Firestore** database (start in production mode)
4. Deploy rules from `firestore.rules` in this repo
5. Register a **Web app** and copy config

### 2. Environment variables (Vercel)

Set these, then **Redeploy**:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Do **not** use Storage. No `VITE_FIREBASE_STORAGE_BUCKET` required.

### 3. First admin user

1. Firebase Console → Authentication → Add user  
   - Email: your admin email (e.g. the shop owner email)  
   - Password: choose a strong password (never commit it)
2. Copy the user's **UID**
3. Firestore → collection `users` → document ID = **UID** with fields:

```json
{
  "email": "your-admin@email.com",
  "displayName": "Admin",
  "role": "ADMIN",
  "active": true,
  "createdAt": "2026-09-19T00:00:00.000Z",
  "updatedAt": "2026-09-19T00:00:00.000Z"
}
```

4. Sign in on the deployed app with that email and password.

### 4. Indexes

If Firestore asks for composite indexes (products active+name, sales createdAt), click the link in the browser console error and create them.

## Local development

```bash
npm install
cp .env.example .env
# fill .env
npm run dev
```

## Production

```bash
npm run build
```

Deploy `dist/` to Vercel (SPA rewrite already in `vercel.json`).

## Security

- Never commit `.env` or passwords
- Role checks are in `firestore.rules`
- Cashier can create sales; cannot change cost prices without manager/admin product rights

## Single shop

This system is for **one shop only** — A.J Motorbike Spares & Accessories. No multi-branch mode.
