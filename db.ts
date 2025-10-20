import Database from 'better-sqlite3';

export interface ProfileRow {
  wallet: string;
  data: string;
}

export interface CheeseRow {
  wallet: string;
  lastClaim: number;
  amount: number;
}
let _db: any = null;

export interface DBHandles {
  insertProfile: any;
  getProfiles: any;
  insertCheese: any;
  getCheese: any;
}

export let db: any = null;
export let insertProfile: any = null;
export let getProfiles: any = null;
export let insertCheese: any = null;
export let getCheese: any = null;

export function initDB() {
  if (_db) return;
  _db = new Database('pockit.db');
  db = _db;

  _db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      wallet TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS cheese (
      wallet TEXT PRIMARY KEY,
      lastClaim INTEGER NOT NULL,
      amount INTEGER NOT NULL
    );
  `);

  // prepare statements after DB exists
  insertProfile = _db.prepare('INSERT OR REPLACE INTO profiles (wallet, data) VALUES (?, ?)');
  getProfiles = _db.prepare('SELECT * FROM profiles');
  insertCheese = _db.prepare('INSERT OR REPLACE INTO cheese (wallet, lastClaim, amount) VALUES (?, ?, ?)');
  getCheese = _db.prepare('SELECT * FROM cheese');

  console.log('Database initialized successfully.');
}