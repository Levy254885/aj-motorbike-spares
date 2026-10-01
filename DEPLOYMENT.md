# AJ Motorbike Spares — Deployment Guide

Offline Windows POS + inventory. No internet required after install.

## Requirements to *build* the installer (developer machine)

- Node.js 20+ (LTS)
- Windows 10/11 **x64** recommended for producing the Windows installer  
  (building on Linux/macOS for Windows is possible but more fragile)

You do **not** need Node, Git, or VS Code on the shop computer.

## Build the Windows installer

```bash
git clone https://github.com/Levy254885/aj-motorbike-spares.git
cd aj-motorbike-spares
npm install
npm run dist
```

Artifacts appear in the `release/` folder:

| File | Purpose |
|------|---------|
| `AJ-Motorbike-Spares-Setup-1.0.0.exe` | NSIS installer (Start Menu + Desktop shortcuts) |
| `AJ-Motorbike-Spares-Portable-1.0.0.exe` | Portable single-file executable (optional) |

Also useful:

```bash
npm run dist:dir   # unpacked app folder (for testing without installer)
```

## Install on the shop PC

1. Copy `AJ-Motorbike-Spares-Setup-1.0.0.exe` to the Windows computer (USB is fine).
2. Run the installer.
3. Choose install directory (default is fine).
4. Finish — Start Menu and Desktop shortcuts are created.
5. Launch **AJ Motorbike Spares**.

First launch creates the local database and default users.

### Default logins

| Role    | Username  | Password     | PIN  |
|---------|-----------|--------------|------|
| Admin   | `admin`   | `admin123`   | `1234` |
| Cashier | `cashier` | `cashier123` | `1111` |

**Change these immediately** under Users (admin only).

## Where business data is stored

Application files and business data are **separated**.

| What | Location |
|------|----------|
| App binaries | `C:\\Users\\<User>\\AppData\\Local\\Programs\\AJ Motorbike Spares\\` (typical) |
| SQLite database | `%APPDATA%\\AJ Motorbike Spares\\aj-motorbike-spares.sqlite` |

Uninstalling or updating the app **does not** delete the database (`deleteAppDataOnUninstall` is false).

## Offline operation

After install, disconnect Wi-Fi / Ethernet. The following still work:

- Login, Dashboard, Products, Inventory, POS, barcode search, checkout  
- Sales, receipts, reports, users, settings, backup, restore  

No cloud services are used.

## Backup

1. Sign in as **admin**.
2. Open **Backup**.
3. Click **Create backup** — saves under Documents → `AJ Motorbike Spares Backups`  
   (or the folder configured in Settings).
4. Or use **Export database** and choose Desktop / USB.

Backup filename example:

`aj-motorbike-spares-backup-2026-10-01T08-30-00-000Z.sqlite`

## Restore

1. Admin → **Backup** → **Restore backup**.
2. Select a `.sqlite` / `.db` backup file.
3. Confirm — current database is replaced.
4. Restart the app if prompted.

Always keep a recent backup before restore.

## Updating the application

1. Build a new installer with a higher `version` in `package.json` (e.g. `1.1.0`).
2. Install over the previous version (or uninstall app only — **do not** delete `%APPDATA%\\AJ Motorbike Spares`).
3. On launch, schema migrations run automatically; existing sales/stock are preserved.
4. Products are **not** re-seeded if the database already has data.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App won't start | Reinstall; ensure Windows x64. Check Event Viewer. |
| Blank window | Delete `%APPDATA%\\AJ Motorbike Spares\\` only if you accept data loss, or restore from backup. |
| Login fails | Use default admin credentials; reset via backup/restore if needed. |
| Stock not updating | Confirm sale completed (F8 / Complete sale); check Inventory history. |
| Printer | Receipts use the OS print dialog — select any installed Windows printer. |

Logs (if enabled): `%APPDATA%\\AJ Motorbike Spares\\logs\\`

## Development commands

```bash
npm run dev          # Vite + Electron with hot reload
npm run build        # Production React + main process compile
npm run dist         # Windows NSIS + portable installer
npm run seed         # Optional; first launch already seeds empty DB
```

## Versioning

- Application version: `package.json` → `version`
- Database schema: table `schema_migrations` (version 1 at initial release)

Future schema changes ship as sequential migrations in `src/main/database/db.ts` → `runMigrations()`.
