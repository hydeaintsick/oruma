import { Model } from "./Model";

export type NoteCategory =
  | "MUSIC"
  | "PERSONAL"
  | "GIFT"
  | "HOBBIES"
  | "NEWS"
  | "OTHERS"
  | "WORK";

export interface NoteType {
  id: number;
  userId: number;
  category: NoteCategory;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class NoteModel extends Model {
  constructor() {
    super();
  }

  async create(
    note: Omit<NoteType, "id" | "createdAt" | "updatedAt">
  ): Promise<NoteType> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      "INSERT INTO notes (userId, category, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [note.userId, note.category, note.content, now, now]
    );

    return {
      id: result.lastInsertRowId,
      ...note,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAll(): Promise<NoteType[]> {
    const db = await this.getDb();
    const result = await db.getAllAsync<NoteType>("SELECT * FROM notes");
    return result;
  }

  async getById(id: number): Promise<NoteType | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<NoteType>(
      "SELECT * FROM notes WHERE id = ?",
      [id]
    );
    return result || null;
  }

  async getByUserId(userId: number): Promise<NoteType[]> {
    const db = await this.getDb();
    const result = await db.getAllAsync<NoteType>(
      "SELECT * FROM notes WHERE userId = ?",
      [userId]
    );
    return result;
  }

  async update(
    id: number,
    updates: Partial<Omit<NoteType, "id" | "createdAt">>
  ): Promise<boolean> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const keys = Object.keys(updates);
    if (keys.length === 0) return false;

    const fields = keys.map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updates);
    values.push(now);
    values.push(id);

    const result = await db.runAsync(
      `UPDATE notes SET ${fields}, updatedAt = ? WHERE id = ?`,
      values
    );
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
    return result.changes > 0;
  }
}

export const Note = new NoteModel();

export default Note;
