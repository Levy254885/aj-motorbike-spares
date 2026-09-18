# A.J Motorbike Spares & Accessories

**Inventory Management & Point-of-Sale System**

Production-oriented web application for a Kenyan motorcycle spare-parts and accessories shop.

**Currency:** Kenyan Shillings (KSh)

## Features

- Firebase Authentication with role-based access (ADMIN, CASHIER, STOREKEEPER)
- Product & inventory management with motorcycle compatibility
- Stock movements audit trail
- Low-stock and out-of-stock alerts
- Point of Sale (desktop + mobile-oriented layout)
- Sales, receipts, returns/refunds
- Purchases & suppliers
- Customers
- Expenses
- Reports (sales, profit, inventory, payments)
- Audit log
- Business settings
- CSV/Excel export support (via xlsx)
- Responsive design (mobile, tablet, desktop)
- PWA-ready manifest

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Firebase (Auth, Firestore, Storage)
- React Router
- Recharts
- date-fns, lucide-react, zod, react-hook-form, xlsx

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Levy254885/aj-motorbike-spares.git
cd aj-motorbike-spares
npm install
```

### 2. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** → Email/Password.
3. Create a **Cloud Firestore** database.
4. Enable **Storage**.
5. Register a Web app and copy the config.
6. Copy `.env.example` to `.env` and fill in the values.

### 3. Create the first Admin user

1. In Firebase Authentication, create a user (email + password).
2. In Firestore, create a document in `users/{uid}` with role ADMIN.

### 4. Security Rules

Deploy `firestore.rules` and `storage.rules`.

### 5. Run

```bash
npm run dev
```

## Firestore Collections

users, products, categories, suppliers, customers, sales, purchases, stockMovements, expenses, notifications, auditLogs, settings

See full field documentation in repository.

## Roles

- ADMIN: full access
- CASHIER: POS, sales, customers, view inventory
- STOREKEEPER: inventory, stock, purchases, suppliers

## Deployment

Vercel: connect repo, add VITE_FIREBASE_* env vars, build `npm run build`, output `dist`.
