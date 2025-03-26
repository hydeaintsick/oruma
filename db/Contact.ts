import { Model } from "./Model";
import { v4 as uuidv4 } from "uuid";

export type ContactCategory = "ALL" | "FRIEND" | "WORK" | "FAMILY";

export interface ContactType {
  id: number;
  nativeID: string;
  firstName: string;
  lastName: string;
  category: ContactCategory;
  createdAt: string;
  updatedAt: string;
}

export class ContactModel extends Model {
  constructor() {
    super();
  }

  async create(
    contact: Omit<ContactType, "id" | "createdAt" | "updatedAt">
  ): Promise<ContactType> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const nativeID = contact.nativeID || uuidv4();

    const result = await db.runAsync(
      "INSERT INTO contacts (nativeID, firstName, lastName, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nativeID,
        contact.firstName,
        contact.lastName,
        contact.category,
        now,
        now,
      ]
    );

    return {
      id: result.lastInsertRowId,
      ...contact,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAll(): Promise<ContactType[]> {
    const db = await this.getDb();
    return await db.getAllAsync<ContactType>("SELECT * FROM contacts");
  }

  async getById(id: number): Promise<ContactType | null> {
    const db = await this.getDb();
    return (
      (await db.getFirstAsync<ContactType>(
        "SELECT * FROM contacts WHERE id = ?",
        [id]
      )) || null
    );
  }

  async getByNativeID(nativeID: string): Promise<ContactType | null> {
    const db = await this.getDb();
    return (
      (await db.getFirstAsync<ContactType>(
        "SELECT * FROM contacts WHERE nativeID = ?",
        [nativeID]
      )) || null
    );
  }

  async update(
    id: number,
    updates: Partial<Omit<ContactType, "id" | "createdAt">>
  ): Promise<boolean> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const keys = Object.keys(updates);
    if (keys.length === 0) return false;

    const fields = keys.map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updates);
    values.push(now);
    // @ts-expect-error
    values.push(id);

    const result = await db.runAsync(
      `UPDATE contacts SET ${fields}, updatedAt = ? WHERE id = ?`,
      values
    );
    return result.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.runAsync("DELETE FROM contacts WHERE id = ?", [id]);
    return result.changes > 0;
  }

  async batchSave(
    contacts: Omit<ContactType, "id" | "createdAt" | "updatedAt">[]
  ): Promise<number> {
    if (contacts.length === 0) return 0; // Rien à insérer

    const db = await this.getDb();
    const now = new Date().toISOString();
    let insertedCount = 0;

    try {
      console.log("⏳ Début de la transaction batchSave...");
      await db.execAsync("BEGIN TRANSACTION;"); // Début transaction

      for (const contact of contacts) {
        const existing = await this.getByNativeID(contact.nativeID);
        if (!existing) {
          const result = await db.runAsync(
            `INSERT INTO contacts (nativeID, firstName, lastName, category, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              contact.nativeID,
              contact.firstName,
              contact.lastName,
              contact.category,
              now,
              now,
            ]
          );

          if (result.lastInsertRowId) {
            insertedCount++;
          }
        }
      }

      await db.execAsync("COMMIT;"); // Valide la transaction
      console.log("✅ Transaction batchSave validée.");
      return insertedCount;
    } catch (error) {
      console.error("❌ Erreur batchSave:", error);
      await db.execAsync("ROLLBACK;"); // Annule la transaction en cas d'erreur
      return 0;
    } finally {
      console.log("🛑 Fermeture propre de la transaction.");
    }
  }
}

export const Contact = new ContactModel();

export default Contact;
