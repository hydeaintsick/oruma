import * as SQLite from "expo-sqlite";

export class Model {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await SQLite.openDatabaseAsync("oruma");

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
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync("oruma");
    }
    return this.db;
  }
}

export default Model;
