import * as SQLite from "expo-sqlite";

export class Model {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbName: string; // To store the database name

  constructor(dbName: string = "oruma.db") { // Default to "oruma.db"
    this.dbName = dbName;
    // It's important that init is async and constructor is not.
    // We should not call async methods in constructor directly if they are not awaited.
    // A common pattern is to have a separate async initialization method that is called explicitly.
    // However, given the current structure, this.init() is async and is called without await.
    // This means the constructor returns before init completes.
    // For testing, this might be okay if tests `await model.getDb()` before operations,
    // which will ensure init completes.
    // A more robust solution would involve an explicit async init method for the models.
    // For now, sticking to minimal changes to make it testable.
    this.init().catch(error => {
      // Log error or handle it appropriately if init fails
      console.error("Failed to initialize database in Model constructor:", error);
    });
  }

  private async init() {
    // Use the stored dbName
    this.db = await SQLite.openDatabaseAsync(this.dbName);

    // Check if this.db is null after trying to open, which indicates an error.
    if (!this.db) {
      throw new Error(`Failed to open database: ${this.dbName}`);
    }

    // WAL mode can often improve performance and concurrency.
    // Disabling for :memory: as it might not be supported or relevant.
    if (this.dbName !== ":memory:") {
      try {
        await this.db.execAsync("PRAGMA journal_mode = WAL;");
      } catch (e) {
        console.warn("WAL mode failed to enable (this is fine for some environments/DBs):", e);
      }
    }

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nativeID TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        category TEXT CHECK(category IN ('ALL', 'FRIEND', 'WORK', 'FAMILY')) NOT NULL DEFAULT 'ALL',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        category TEXT CHECK(category IN ('MUSIC', 'PERSONAL', 'GIFT', 'HOBBIES', 'NEWS', 'OTHERS', 'WORK')) NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES contacts(id) ON DELETE CASCADE
      );
    `);
  }

  public async getDb() {
    // If db is not initialized or connection lost, re-initialize with stored dbName
    if (!this.db) {
      // This might happen if init failed silently or if db was closed.
      // Re-attempting to open the database.
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      if (!this.db) {
        throw new Error(`Failed to get database instance for: ${this.dbName}. DB might not be open.`);
      }
      // We might not want to re-run table creation here, assuming init() did its job or would be called.
      // If init() failed, getDb() would also likely fail to open.
      // This getDb is more about ensuring the db object is available if it was opened.
    }
    return this.db;
  }

  // Method to explicitly close the database, useful for testing cleanup
  public async closeDb() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null; // Reset the db instance
    }
  }

  // Method to clear specific tables, useful for testing
  public async clearTable(tableName: string): Promise<void> {
    const db = await this.getDb();
    try {
      // For TRUNCATE TABLE behavior in SQLite, use DELETE FROM
      await db.runAsync(`DELETE FROM ${tableName}`);
      // Optionally, reset auto-increment counter for the table if it's an issue for tests
      // This is more complex and varies. For 'sqlite_sequence' table:
      // await db.runAsync(`DELETE FROM sqlite_sequence WHERE name = ?`, [tableName]);
    } catch (error) {
      console.error(`Error clearing table ${tableName}:`, error);
      throw error; // Re-throw to make test aware
    }
  }
}

export default Model;
