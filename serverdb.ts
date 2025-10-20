import Database from 'better-sqlite3';

// Row types for the database tables
interface ProfileRow {
    wallet: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    createdAt?: number;
}

interface CheeseRow {
    wallet: string;
    amount: number;
    lastClaim?: number;
}

class ServerDB {
    private db: Database.Database;
    constructor() {
        this.db = new Database('pockit.db', { 
            // verbose: console.log 
        });
        this.db.pragma('journal_mode = WAL');

        this.initDB();
    }
    
    initDB() {
        this.initProfilesTable();
        this.initCheeseTable();
    }

    // PROFILES BY WALLET

    initProfilesTable() {
        const createProfilesTable = `
            CREATE TABLE IF NOT EXISTS profiles (
                wallet TEXT PRIMARY KEY,
                name TEXT,
                avatarUrl TEXT,
                bio TEXT,
                createdAt INTEGER
            );
        `;
        this.db.exec(createProfilesTable);
    }

    getProfile(wallet: string): ProfileRow | undefined {
        const stmt = this.db.prepare('SELECT * FROM profiles WHERE wallet = ?');
    return stmt.get(wallet) as ProfileRow | undefined;
    }

    getProfilesCount(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as cnt FROM profiles');
        const row = stmt.get() as { cnt: number } | undefined;
        return row ? row.cnt : 0;
    }

    saveProfile(wallet: string, name: string, avatarUrl: string, bio: string) {
        const stmt = this.db.prepare(`
            INSERT INTO profiles (wallet, name, avatarUrl, bio, createdAt)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(wallet) DO UPDATE SET
                name = excluded.name,
                avatarUrl = excluded.avatarUrl,
                bio = excluded.bio
        `);
        stmt.run(wallet, name, avatarUrl, bio, Date.now());
    }


    // CHEESE CURRENCY
    initCheeseTable() {
        const createCheeseTable = `
            CREATE TABLE IF NOT EXISTS cheese (
                wallet TEXT PRIMARY KEY,
                amount INTEGER,
                lastClaim INTEGER
            );
        `;
        this.db.exec(createCheeseTable);
    }
    
    getCheese(wallet: string): CheeseRow | undefined {
        const stmt = this.db.prepare('SELECT * FROM cheese WHERE wallet = ?');
    return stmt.get(wallet) as CheeseRow | undefined;
    }

    claimCheese(wallet: string, amount: number) {
        const now = Date.now();
        const stmt = this.db.prepare(`
            INSERT INTO cheese (wallet, amount, lastClaim)
            VALUES (?, ?, ?)
            ON CONFLICT(wallet) DO UPDATE SET
                amount = amount + excluded.amount,
                lastClaim = excluded.lastClaim
        `);
        stmt.run(wallet, amount, now);
    }

    spendCheese(wallet: string, amount: number): boolean {
        const cheese = this.getCheese(wallet);
        if (!cheese || cheese.amount < amount) {
            return false; // Not enough cheese
        }
        const stmt = this.db.prepare(`
            UPDATE cheese
            SET amount = amount - ?
            WHERE wallet = ?
        `);
        stmt.run(amount, wallet);
        return true;
    }

    // Close the database connection
    close() {
        try {
            this.db.close();
        } catch (err) {
            // ignore errors when closing
            console.error('Error closing database', err);
        }
    }
}

export default ServerDB;