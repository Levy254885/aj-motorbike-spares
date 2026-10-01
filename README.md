# AJ Motorbike Spares

**Offline desktop POS + Inventory** for AJ Motorbike Spares.

Built with **Electron · React · TypeScript · SQLite (better-sqlite3)**.

No Firebase. No cloud database. No internet required for normal operation.

## Features

- Local admin / cashier login (password or PIN, PBKDF2 hashed)
- Role-based screens
- Live dashboard (today’s sales, transactions, low stock, inventory value)
- Product & category management with realistic motorcycle spare seed data
- Inventory adjustments with full movement history
- POS with barcode-scanner-friendly search, cart, stock checks
- Payment methods: Cash, M-Pesa, Card, Other
- Atomic sales transactions (sale + line items + stock + movements + payment)
- Invoice numbers: `AJ-YYYYMMDD-0001`
- Receipts (print via OS printer dialog)
- Optional customers
- Returns / refunds with stock restore
- Sales, product, cashier, profit, inventory, low-stock reports (CSV / PDF export)
- Settings, user management
- Database backup / restore / export

## Default logins

| Role    | Username | Password    | PIN  |
|---------|----------|-------------|------|
| Admin   | `admin`  | `admin123`  | `1234` |
| Cashier | `cashier`| `cashier123`| `1111` |

Change these before production use.

## Currency

**KES** (configurable in Settings).

## Setup (development)

```bash
npm install
npm run seed   # optional; DB auto-seeds on first launch
npm run dev
```

## Production build

```bash
npm run build
```

## Windows installer (shop PC)

**Build on a Windows x64 machine** (recommended):

```bash
npm install
npm run dist
```

Artifacts in `release/`:

| File | Description |
|------|-------------|
| `AJ-Motorbike-Spares-Setup-1.0.0.exe` | NSIS installer (Start Menu + Desktop shortcuts) |
| `AJ-Motorbike-Spares-Portable-1.0.0.exe` | Portable executable |

Copy the Setup.exe to a USB drive, run it on the shop PC, launch **AJ Motorbike Spares**, log in, and start selling — no Node, Git, or internet required.

Business data is stored outside the install folder:

`%APPDATA%\\AJ Motorbike Spares\\aj-motorbike-spares.sqlite`

Full install / backup / update steps: see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Architecture

```
Electron Main
  → SQLite (better-sqlite3) + business services
  → IPC
  → Preload bridge (contextIsolation)
  → React renderer
```

## Offline

After install, the app works with **no internet**: login, POS, inventory, sales, receipts, reports, backup, restore.
