import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { initialMigration } from './migration.js';
import * as schema from './schema.js';
import { hashSecret } from '../services/security.js';

export type Sqlite = Database.Database;

let sqlite: Sqlite | null = null;
let orm: ReturnType<typeof drizzle<typeof schema>> | null = null;

const defaultSettings: Record<string, string> = {
  storeName: 'AJ Motorbike Spares',
  storeAddress: 'Nairobi, Kenya',
  phone: '+254 700 000000',
  taxPercentage: '0',
  currency: 'KES',
  receiptFooter: 'Thank you for shopping at AJ Motorbike Spares. Karibu tena!',
  backupLocation: '',
  printerName: '',
  autoBackup: 'true'
};

const CATEGORIES = [
  ['Engine Parts', 'Pistons, gaskets, valves, cylinders'],
  ['Brake System', 'Pads, shoes, discs, cables'],
  ['Electrical', 'Batteries, CDI, coils, bulbs'],
  ['Suspension', 'Fork seals, shocks, bearings'],
  ['Body Parts', 'Mirrors, levers, fairings, covers'],
  ['Transmission', 'Chains, sprockets, clutch plates'],
  ['Accessories', 'Filters, cables, tools, misc']
];

const PRODUCTS: Array<[string, string, string, string, number, number, number, number]> = [
  ['Brake Pads Front (Universal)', 'BRK-PAD-F01', '890100000001', 'Brake System', 450, 850, 40, 8],
  ['Brake Pads Rear (Universal)', 'BRK-PAD-R01', '890100000002', 'Brake System', 380, 720, 35, 8],
  ['Brake Shoe Set', 'BRK-SHOE-01', '890100000003', 'Brake System', 320, 600, 50, 10],
  ['Brake Cable Front', 'BRK-CAB-F01', '890100000004', 'Brake System', 180, 350, 60, 12],
  ['Clutch Cable', 'CLT-CAB-01', '890100000005', 'Transmission', 160, 320, 55, 12],
  ['Throttle Cable', 'THR-CAB-01', '890100000006', 'Engine Parts', 140, 280, 45, 10],
  ['Drive Chain 428H 120L', 'CHN-428-120', '890100000007', 'Transmission', 1200, 2200, 25, 5],
  ['Chain Kit 428 (Chain + Sprockets)', 'CHN-KIT-428', '890100000008', 'Transmission', 2800, 4500, 15, 4],
  ['Front Sprocket 14T', 'SPR-F-14', '890100000009', 'Transmission', 350, 650, 30, 6],
  ['Rear Sprocket 42T', 'SPR-R-42', '890100000010', 'Transmission', 550, 980, 28, 6],
  ['Clutch Plate Set (5pcs)', 'CLT-PLT-05', '890100000011', 'Transmission', 900, 1600, 20, 5],
  ['Spark Plug NGK C7HSA', 'SPK-NGK-C7', '890100000012', 'Electrical', 180, 350, 100, 20],
  ['Spark Plug Iridium', 'SPK-IRD-01', '890100000013', 'Electrical', 450, 850, 40, 8],
  ['Air Filter Element', 'FLT-AIR-01', '890100000014', 'Accessories', 250, 480, 45, 10],
  ['Oil Filter Cartridge', 'FLT-OIL-01', '890100000015', 'Accessories', 200, 380, 50, 10],
  ['Motorcycle Battery 12V 7Ah', 'BAT-12V-7', '890100000016', 'Electrical', 2800, 4500, 18, 4],
  ['Headlight Bulb H4 12V', 'BLB-H4-12', '890100000017', 'Electrical', 220, 420, 60, 12],
  ['Indicator Bulb Pair', 'BLB-IND-01', '890100000018', 'Electrical', 80, 160, 80, 15],
  ['CDI Unit Universal', 'CDI-UNI-01', '890100000019', 'Electrical', 1500, 2800, 12, 3],
  ['Ignition Coil', 'IGN-COIL-01', '890100000020', 'Electrical', 650, 1200, 22, 5],
  ['Side Mirror Pair (Chrome)', 'MIR-CHR-01', '890100000021', 'Body Parts', 450, 850, 30, 6],
  ['Brake Lever Left', 'LVR-BRK-L', '890100000022', 'Body Parts', 280, 520, 35, 8],
  ['Clutch Lever Right', 'LVR-CLT-R', '890100000023', 'Body Parts', 280, 520, 35, 8],
  ['Fork Seal Kit 33mm', 'FRK-SEAL-33', '890100000024', 'Suspension', 380, 720, 25, 5],
  ['Wheel Bearing 6201', 'BRG-6201', '890100000025', 'Suspension', 120, 250, 70, 15],
  ['Wheel Bearing 6202', 'BRG-6202', '890100000026', 'Suspension', 140, 280, 65, 15],
  ['Engine Oil 10W-40 1L', 'OIL-10W40-1', '890100000027', 'Accessories', 650, 1100, 80, 15],
  ['Chain Lube Spray 400ml', 'LUB-CHN-400', '890100000028', 'Accessories', 350, 650, 40, 8],
  ['Handlebar Grip Pair', 'GRP-HND-01', '890100000029', 'Body Parts', 180, 350, 40, 8],
  ['Fuel Tap / Petcock', 'FUL-TAP-01', '890100000030', 'Engine Parts', 320, 600, 20, 5]
];

export function getDatabasePath() {
  // Always use Electron userData when available so app updates never wipe business data.
  // Windows example: %APPDATA%\\AJ Motorbike Spares\\aj-motorbike-spares.sqlite
  let userData = process.cwd();
  try {
    if (app && typeof app.getPath === 'function') {
      userData = app.getPath('userData');
    }
  } catch {
    // app not ready / not in electron context (e.g. seed script)
  }
  fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, 'aj-motorbike-spares.sqlite');
}

/** Apply incremental schema upgrades safely without wiping data. */
export function runMigrations(db: Sqlite) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const row = db.prepare('SELECT MAX(version) as v FROM schema_migrations').get() as { v: number | null };
  let current = row?.v ?? 0;
  // Future migrations go here, e.g.:
  // if (current < 2) { db.exec('ALTER TABLE ...'); db.prepare('INSERT INTO schema_migrations ...').run(2, ...); current = 2; }
  if (current < 1) {
    db.prepare('INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
      1,
      new Date().toISOString()
    );
  }
}

export function connectDatabase(filePath = getDatabasePath()) {
  if (sqlite) return sqlite;
  sqlite = new Database(filePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(initialMigration);
  runMigrations(sqlite);
  seedDatabase(sqlite);
  orm = drizzle(sqlite, { schema });
  return sqlite;
}

export function getDb() {
  return connectDatabase();
}

export function getOrm() {
  if (!orm) connectDatabase();
  return orm!;
}

export function closeDatabase() {
  sqlite?.close();
  sqlite = null;
  orm = null;
}

export function backupDatabase(destination: string) {
  const db = getDb();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  db.backup(destination);
}

function seedDatabase(db: Sqlite) {
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (roleCount.count === 0) {
    db.prepare('INSERT INTO roles (name, permissions) VALUES (?, ?)').run('admin', JSON.stringify(['*']));
    db.prepare('INSERT INTO roles (name, permissions) VALUES (?, ?)').run(
      'cashier',
      JSON.stringify(['sales:read', 'sales:write', 'products:search', 'customers:read', 'customers:write'])
    );
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin') as { id: number };
    const cashierRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('cashier') as { id: number };
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO users (username, full_name, password_hash, pin_hash, role_id, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
    ).run('admin', 'Store Admin', hashSecret('admin123'), hashSecret('1234'), adminRole.id, now);
    db.prepare(
      'INSERT INTO users (username, full_name, password_hash, pin_hash, role_id, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
    ).run('cashier', 'Default Cashier', hashSecret('cashier123'), hashSecret('1111'), cashierRole.id, now);
  }

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, description, active) VALUES (?, ?, 1)');
    for (const [name, desc] of CATEGORIES) insertCat.run(name, desc);
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    const insert = db.prepare(
      `INSERT INTO products (name, sku, barcode, category_id, description, unit, purchase_price, selling_price, stock_quantity, low_stock_threshold, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pcs', ?, ?, ?, ?, 1, ?, ?)`
    );
    const now = new Date().toISOString();
    for (const [name, sku, barcode, catName, buy, sell, stock, low] of PRODUCTS) {
      const cat = db.prepare('SELECT id FROM categories WHERE name = ?').get(catName) as { id: number } | undefined;
      insert.run(name, sku, barcode, cat?.id ?? null, name, buy, sell, stock, low, now, now);
    }
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    db.prepare('INSERT OR IGNORE INTO settings ("key", value) VALUES (?, ?)').run(key, value);
  }
}
