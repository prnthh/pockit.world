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

export const db = new Database('pockit.db');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      wallet TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cheese (
      wallet TEXT PRIMARY KEY,
      lastClaim INTEGER NOT NULL,
      amount INTEGER NOT NULL
    );
  `);

  console.log('Database initialized successfully.');
}

// Initialize the database on module load
initDB();

export const insertProfile = db.prepare('INSERT OR REPLACE INTO profiles (wallet, data) VALUES (?, ?)');

export const getProfiles = db.prepare('SELECT * FROM profiles');

export const insertCheese = db.prepare('INSERT OR REPLACE INTO cheese (wallet, lastClaim, amount) VALUES (?, ?, ?)');

export const getCheese = db.prepare('SELECT * FROM cheese');