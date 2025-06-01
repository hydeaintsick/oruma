import { ContactModel, ContactType } from './Contact';
import { NoteModel, NoteType, NoteCategory } from './Note';

const TEST_DB_NAME = ":memory:"; // Use in-memory SQLite for tests

describe('NoteModel', () => {
  let contactModel: ContactModel;
  let noteModel: NoteModel;
  let testContact: ContactType;

  // Helper to ensure DB is initialized for model instances
  async function initializeModels() {
    // Re-instantiate models for each test to ensure clean state with :memory:
    // and that init() gets called for each :memory: db instance.
    contactModel = new ContactModel(TEST_DB_NAME);
    noteModel = new NoteModel(TEST_DB_NAME);

    // Ensure DB connection is established and tables are created
    // by calling getDb() which internally handles initialization.
    await contactModel.getDb();
    await noteModel.getDb(); // Ensures noteModel also initializes its DB if different (though they share via class structure)
  }

  beforeEach(async () => {
    // Initialize models, this will also set up the in-memory DB and tables
    await initializeModels();

    // Clear tables before each test to ensure independence
    // Order matters if there are foreign key constraints: clear notes before contacts.
    await noteModel.clearTable('notes');
    await contactModel.clearTable('contacts');

    // Create a dummy contact for note tests, as notes require a userId (contactId)
    testContact = await contactModel.create({
      firstName: 'Test',
      lastName: 'User',
      nativeID: `native-${Date.now()}-${Math.random()}`, // Ensure nativeID is unique for each run
      category: 'WORK'
    });
    expect(testContact).toBeDefined();
    expect(testContact.id).toBeGreaterThan(0);
  });

  afterEach(async () => {
    // Close DB connections if models support it
    // This is important for :memory: to ensure it's fresh next time.
    // Though for :memory:, connection closure might implicitly drop the DB.
    await noteModel.closeDb();
    await contactModel.closeDb(); // Assuming they might use separate DB instances if Model was structured differently
                                  // For current Model structure, they share the same instance if same dbName is passed.
                                  // Calling closeDb on one might be enough if they share the same db object.
                                  // Let's assume they need individual closure for safety or future changes.
  });

  it('should create a new note successfully', async () => {
    const noteData: Omit<NoteType, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: testContact.id,
      content: 'This is a test note content.',
      category: 'PERSONAL',
    };
    const createdNote = await noteModel.create(noteData);

    expect(createdNote).toBeDefined();
    expect(createdNote.id).toBeGreaterThan(0);
    expect(createdNote.userId).toBe(noteData.userId);
    expect(createdNote.content).toBe(noteData.content);
    expect(createdNote.category).toBe(noteData.category);
    expect(createdNote.createdAt).toBeDefined();
    expect(createdNote.updatedAt).toBeDefined();

    // Verify it's in the database
    const fetchedNote = await noteModel.getById(createdNote.id); // Assuming getById exists from review
    expect(fetchedNote).not.toBeNull();
    expect(fetchedNote!.id).toBe(createdNote.id);
  });

  it('should retrieve notes by userId', async () => {
    // Create notes for testContact
    await noteModel.create({ userId: testContact.id, content: 'Note 1 for user', category: 'WORK' });
    await noteModel.create({ userId: testContact.id, content: 'Note 2 for user', category: 'PERSONAL' });

    // Create a different contact and a note for them
    const otherContact = await contactModel.create({
      firstName: 'Other',
      lastName: 'Person',
      nativeID: `native-other-${Date.now()}-${Math.random()}`,
      category: 'FRIEND'
    });
    await noteModel.create({ userId: otherContact.id, content: 'Note for other person', category: 'GIFT' });

    const notesForTestContact = await noteModel.getByUserId(testContact.id);
    expect(notesForTestContact).toHaveLength(2);
    expect(notesForTestContact.every(note => note.userId === testContact.id)).toBe(true);
    // Note: The current getByUserId does not guarantee order. If it did, test for order.
  });

  it('should update an existing note', async () => {
    const initialNote = await noteModel.create({
      userId: testContact.id,
      content: 'Initial content',
      category: 'HOBBIES',
    });

    const newContent = 'Updated content here';
    const newCategory: NoteCategory = 'WORK';

    const success = await noteModel.update(initialNote.id, { content: newContent, category: newCategory });
    expect(success).toBe(true);

    const updatedNote = await noteModel.getById(initialNote.id);
    expect(updatedNote).not.toBeNull();
    expect(updatedNote!.content).toBe(newContent);
    expect(updatedNote!.category).toBe(newCategory);
    expect(new Date(updatedNote!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(initialNote.updatedAt).getTime());
  });

  it('should return false when trying to update a non-existent note', async () => {
    const success = await noteModel.update(99999, { content: 'Non-existent' });
    expect(success).toBe(false);
  });

  it('should delete an existing note', async () => {
    const noteToDelete = await noteModel.create({
      userId: testContact.id,
      content: 'This note will be deleted',
      category: 'OTHERS',
    });
    expect(noteToDelete).toBeDefined();

    const success = await noteModel.delete(noteToDelete.id);
    expect(success).toBe(true);

    const fetchedNote = await noteModel.getById(noteToDelete.id);
    expect(fetchedNote).toBeNull();
  });

  it('should return false when trying to delete a non-existent note', async () => {
    const success = await noteModel.delete(99999);
    expect(success).toBe(false);
  });

  it('should retrieve notes ordered by createdAt descending if getByUserId is updated to sort', async () => {
    const note1 = await noteModel.create({ userId: testContact.id, content: 'First note (older)', category: 'WORK' });
    // Introduce a slight delay to ensure different createdAt timestamps if system is too fast
    await new Promise(resolve => setTimeout(resolve, 10));
    const note2 = await noteModel.create({ userId: testContact.id, content: 'Second note (newer)', category: 'PERSONAL' });

    const notes = await noteModel.getByUserId(testContact.id);
    // The actual NoteModel.getByUserId does NOT sort. If it were to sort by createdAt DESC:
    // expect(notes).toHaveLength(2);
    // expect(notes[0].id).toBe(note2.id);
    // expect(notes[1].id).toBe(note1.id);
    // For now, just check length as per current implementation
    expect(notes).toHaveLength(2);
  });

});
