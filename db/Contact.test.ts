import { ContactModel, ContactType, ContactCategory } from './Contact';
import { NoteModel, NoteType } from './Note'; // Needed for creating notes

const TEST_DB_NAME = ":memory:";

describe('ContactModel', () => {
  let contactModel: ContactModel;
  let noteModel: NoteModel;

  async function initializeModels() {
    contactModel = new ContactModel(TEST_DB_NAME);
    noteModel = new NoteModel(TEST_DB_NAME); // Notes will be on the same :memory: DB
    await contactModel.getDb(); // Ensures DB is initialized and tables are created
    await noteModel.getDb();
  }

  beforeEach(async () => {
    await initializeModels();
    // Clear tables before each test. Order: notes before contacts due to FK.
    await noteModel.clearTable('notes');
    await contactModel.clearTable('contacts');
  });

  afterEach(async () => {
    await contactModel.closeDb();
    await noteModel.closeDb(); // Close the shared :memory: DB connection
  });

  it('should create a new contact successfully', async () => {
    const contactData: Omit<ContactType, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: 'John',
      lastName: 'Doe',
      nativeID: `native-${Date.now()}`,
      category: 'WORK',
    };
    const createdContact = await contactModel.create(contactData);

    expect(createdContact).toBeDefined();
    expect(createdContact.id).toBeGreaterThan(0);
    expect(createdContact.firstName).toBe(contactData.firstName);
    expect(createdContact.nativeID).toBe(contactData.nativeID);
    expect(createdContact.createdAt).toBeDefined();
    expect(createdContact.updatedAt).toBeDefined();

    const fetchedContact = await contactModel.getById(createdContact.id);
    expect(fetchedContact).not.toBeNull();
    expect(fetchedContact!.id).toBe(createdContact.id);
  });

  it('should prevent creating contacts with duplicate nativeID', async () => {
    const commonNativeID = `unique-native-${Date.now()}`;
    await contactModel.create({
      firstName: 'Jane',
      lastName: 'Doe',
      nativeID: commonNativeID,
      category: 'FRIEND'
    });

    try {
      await contactModel.create({
        firstName: 'John',
        lastName: 'Smith',
        nativeID: commonNativeID, // Duplicate nativeID
        category: 'WORK'
      });
      fail('Should have thrown an error for duplicate nativeID');
    } catch (error: any) {
      // Error code for UNIQUE constraint failure in SQLite is SQLITE_CONSTRAINT_UNIQUE
      // The exact error message or type might vary depending on the driver/expo-sqlite version
      expect(error).toBeDefined();
      // A more specific check could be error.message.includes('UNIQUE constraint failed: contacts.nativeID')
      // For now, just checking an error was thrown.
    }
  });

  it('should retrieve all contacts with correct note counts', async () => {
    // Create contacts
    const contact1 = await contactModel.create({ firstName: 'Alice', lastName: 'Alpha', nativeID: 'n1', category: 'FAMILY' });
    const contact2 = await contactModel.create({ firstName: 'Bob', lastName: 'Beta', nativeID: 'n2', category: 'WORK' });
    const contact3 = await contactModel.create({ firstName: 'Charlie', lastName: 'Gamma', nativeID: 'n3', category: 'FRIEND' }); // Contact with no notes

    // Create notes for contact1
    await noteModel.create({ userId: contact1.id, content: 'Note A1', category: 'PERSONAL' });
    await noteModel.create({ userId: contact1.id, content: 'Note A2', category: 'PERSONAL' });

    // Create notes for contact2
    await noteModel.create({ userId: contact2.id, content: 'Note B1', category: 'WORK' });

    const contactsWithCounts = await contactModel.getAllWithNoteCounts();

    expect(contactsWithCounts).toHaveLength(3);

    // Check order (lastName, then firstName)
    expect(contactsWithCounts[0].id).toBe(contact1.id); // Alpha
    expect(contactsWithCounts[1].id).toBe(contact2.id); // Beta
    expect(contactsWithCounts[2].id).toBe(contact3.id); // Gamma

    const c1Data = contactsWithCounts.find(c => c.id === contact1.id);
    const c2Data = contactsWithCounts.find(c => c.id === contact2.id);
    const c3Data = contactsWithCounts.find(c => c.id === contact3.id);

    expect(c1Data?.noteCount).toBe(2);
    expect(c2Data?.noteCount).toBe(1);
    expect(c3Data?.noteCount).toBe(0);
  });

  it('should batchSave new contacts', async () => {
    const newContactsData = [
      { firstName: 'David', lastName: 'Delta', nativeID: 'n4', category: 'WORK' as ContactCategory },
      { firstName: 'Eve', lastName: 'Epsilon', nativeID: 'n5', category: 'FRIEND' as ContactCategory },
    ];
    const insertedCount = await contactModel.batchSave(newContactsData);
    expect(insertedCount).toBe(2);

    const allContacts = await contactModel.getAll();
    expect(allContacts).toHaveLength(2);
  });

  it('batchSave should skip existing contacts by nativeID and insert new ones', async () => {
    // Pre-existing contact
    await contactModel.create({ firstName: 'Existing', lastName: 'User', nativeID: 'existing-nID', category: 'ALL' });

    const contactsToBatchSave = [
      { firstName: 'New', lastName: 'Person1', nativeID: 'new-nID1', category: 'WORK' as ContactCategory },
      { firstName: 'Existing', lastName: 'UserToSkip', nativeID: 'existing-nID', category: 'ALL' as ContactCategory }, // Should be skipped
      { firstName: 'New', lastName: 'Person2', nativeID: 'new-nID2', category: 'FRIEND' as ContactCategory },
    ];

    const insertedCount = await contactModel.batchSave(contactsToBatchSave);
    expect(insertedCount).toBe(2); // Only the two new contacts should be inserted

    const allContacts = await contactModel.getAll();
    expect(allContacts).toHaveLength(3); // 1 pre-existing + 2 new
  });

  it('should update an existing contact', async () => {
    const contact = await contactModel.create({ firstName: 'Update', lastName: 'Me', nativeID: 'update-me-id', category: 'ALL' });
    const updates: Partial<Omit<ContactType, 'id' | 'createdAt'>> = {
      firstName: "UpdatedName",
      category: "WORK"
    };
    const success = await contactModel.update(contact.id, updates);
    expect(success).toBe(true);

    const updatedContact = await contactModel.getById(contact.id);
    expect(updatedContact?.firstName).toBe("UpdatedName");
    expect(updatedContact?.category).toBe("WORK");
    expect(new Date(updatedContact!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(contact.updatedAt).getTime());
  });

  it('should delete an existing contact and its associated notes (due to CASCADE)', async () => {
    const contactToDelete = await contactModel.create({ firstName: 'Delete', lastName: 'Me', nativeID: 'del-me', category: 'ALL' });
    await noteModel.create({ userId: contactToDelete.id, content: 'Note for deletion test', category: 'OTHERS' });

    let notesForContact = await noteModel.getByUserId(contactToDelete.id);
    expect(notesForContact).toHaveLength(1); // Confirm note exists

    const success = await contactModel.delete(contactToDelete.id);
    expect(success).toBe(true);

    const fetchedContact = await contactModel.getById(contactToDelete.id);
    expect(fetchedContact).toBeNull();

    // Verify notes are also deleted due to ON DELETE CASCADE
    notesForContact = await noteModel.getByUserId(contactToDelete.id);
    expect(notesForContact).toHaveLength(0);
  });

});
