import { Note, NoteCategory, initDB as initNoteDB, NoteTypeRaw } from './Note';

// Mocks for expo-sqlite (consistent with Contact.test.ts)
const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockExecuteSql = jest.fn();

const mockTransactionCallback = async (callback: any) => {
  await callback({
    executeSql: mockExecuteSql,
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: mockGetAllAsync,
  });
};

const mockDB = {
  transactionAsync: jest.fn(mockTransactionCallback),
  transaction: jest.fn((callback) => {
    callback({ executeSql: mockExecuteSql });
  }),
};

// @ts-ignore openDatabase is not defined
global.openDatabase = jest.fn(() => mockDB);

describe('NoteModel (db/Note.ts)', () => {
  beforeAll(async () => {
    mockExecuteSql.mockImplementation((sql) => ({ rows: [], rowsAffected: 0 }));
    mockRunAsync.mockImplementation((sql) => Promise.resolve({ insertId: undefined, rowsAffected: 0 }));

    // initNoteDB or a shared initDB should create the 'notes' table.
    await initNoteDB();

    mockExecuteSql.mockReset(); // Reset DDL mocks
    mockRunAsync.mockReset();
  });

  beforeEach(() => {
    mockRunAsync.mockReset();
    mockGetFirstAsync.mockReset();
    mockGetAllAsync.mockReset();
    mockExecuteSql.mockReset();
  });

  describe('create()', () => {
    it('should create a note with correct data and timestamps', async () => {
      const now = Date.now();
      const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
      const isoNow = new Date(now).toISOString();
      mockRunAsync.mockResolvedValueOnce({ insertId: 10, rowsAffected: 1 });

      const noteData = {
        userId: 1,
        content: 'This is a test note.',
        category: NoteCategory.WORK,
      };
      const newNoteId = await Note.create(noteData);

      expect(newNoteId).toBe(10);
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO notes (userId, content, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [noteData.userId, noteData.content, noteData.category, isoNow, isoNow]
      );
      spyDateNow.mockRestore();
    });
  });

  describe('update()', () => {
    it('should update note content and category, and set updatedAt', async () => {
      const now = Date.now();
      const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
      const isoNow = new Date(now).toISOString();
      const noteId = 10;
      const updateData = {
        content: 'Updated test note content.',
        category: NoteCategory.PERSONAL,
      };

      const existingNoteRaw: NoteTypeRaw = {
        id: noteId,
        userId: 1,
        content: 'Old content',
        category: NoteCategory.WORK,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      };
      mockGetFirstAsync.mockResolvedValueOnce(existingNoteRaw); // For fetching existing note
      mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 }); // For the update operation

      const success = await Note.update(noteId, updateData);

      expect(success).toBe(true);
      expect(mockGetFirstAsync).toHaveBeenCalledWith('SELECT * FROM notes WHERE id = ?', [noteId]);
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'UPDATE notes SET content = ?, category = ?, updatedAt = ? WHERE id = ?',
        [updateData.content, updateData.category, isoNow, noteId]
      );
      spyDateNow.mockRestore();
    });

    it('should only update content if category is not provided, preserving existing category', async () => {
        const now = Date.now();
        const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
        const isoNow = new Date(now).toISOString();
        const noteId = 11;
        const updateData = { content: 'Only content updated.' }; // Category not provided

        const existingNoteRaw: NoteTypeRaw = {
            id: noteId,
            userId: 1,
            content: 'Initial content.',
            category: NoteCategory.WORK, // This should be preserved
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
          };
        mockGetFirstAsync.mockResolvedValueOnce(existingNoteRaw);
        mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 });

        await Note.update(noteId, updateData);

        expect(mockRunAsync).toHaveBeenCalledWith(
            'UPDATE notes SET content = ?, category = ?, updatedAt = ? WHERE id = ?',
            [updateData.content, existingNoteRaw.category, isoNow, noteId] // existingNoteRaw.category is used
        );
        spyDateNow.mockRestore();
    });

    it('should only update category if content is not provided, preserving existing content', async () => {
        const now = Date.now();
        const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
        const isoNow = new Date(now).toISOString();
        const noteId = 12;
        const updateData = { category: NoteCategory.PERSONAL }; // Content not provided

        const existingNoteRaw: NoteTypeRaw = {
            id: noteId,
            userId: 1,
            content: 'Existing content to be preserved.', // This should be preserved
            category: NoteCategory.WORK,
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
          };
        mockGetFirstAsync.mockResolvedValueOnce(existingNoteRaw);
        mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 });

        await Note.update(noteId, updateData);

        expect(mockRunAsync).toHaveBeenCalledWith(
            'UPDATE notes SET content = ?, category = ?, updatedAt = ? WHERE id = ?',
            [existingNoteRaw.content, updateData.category, isoNow, noteId] // existingNoteRaw.content is used
        );
        spyDateNow.mockRestore();
    });

    it('should return false if note to update is not found', async () => {
        mockGetFirstAsync.mockResolvedValueOnce(null); // Simulate note not found
        const success = await Note.update(999, { content: 'Ghost note' });
        expect(success).toBe(false);
        expect(mockRunAsync).not.toHaveBeenCalled();
    });
  });

  describe('deleteById()', () => {
    it('should delete a note by its ID', async () => {
      const noteId = 10;
      mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 });
      const success = await Note.deleteById(noteId);

      expect(success).toBe(true);
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM notes WHERE id = ?', [noteId]);
    });

    it('should return false if note to delete is not found or delete fails', async () => {
        mockRunAsync.mockResolvedValueOnce({ rowsAffected: 0 });
        const success = await Note.deleteById(999);
        expect(success).toBe(false);
    });
  });

  describe('getByUserId()', () => {
    it('should retrieve all notes for a given userId, ordered by createdAt descending', async () => {
      const userId = 1;
      const mockNotesRaw: NoteTypeRaw[] = [
        { id: 1, userId, content: 'Note 1', category: NoteCategory.PERSONAL, createdAt: "2023-01-02T12:00:00.000Z", updatedAt: "2023-01-02T12:00:00.000Z" },
        { id: 2, userId, content: 'Note 2', category: NoteCategory.WORK, createdAt: "2023-01-01T12:00:00.000Z", updatedAt: "2023-01-01T12:00:00.000Z" },
      ];
      mockGetAllAsync.mockResolvedValueOnce(mockNotesRaw);

      const results = await Note.getByUserId(userId);
      // Note: The actual mapRawToNote function should be tested for correctness if it does more than type assertion.
      expect(results).toEqual(mockNotesRaw.map(r => Note.mapRawToNote(r)));
      expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM notes WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );
    });

     it('should return an empty array if no notes found for user', async () => {
        const userId = 2;
        mockGetAllAsync.mockResolvedValueOnce([]); // No notes found
        const results = await Note.getByUserId(userId);
        expect(results).toEqual([]);
      });
  });

  describe('mapRawToNote()', () => {
    it('should correctly map raw data object to NoteType', () => {
        const rawData: NoteTypeRaw = {
            id: 1,
            userId: 101,
            content: 'Test content from raw.',
            category: NoteCategory.OTHERS,
            createdAt: '2023-03-15T10:00:00.000Z',
            updatedAt: '2023-03-15T11:00:00.000Z',
        };
        const expectedNote: ReturnType<typeof Note.mapRawToNote> = {
            id: 1,
            userId: 101,
            content: 'Test content from raw.',
            category: NoteCategory.OTHERS,
            createdAt: '2023-03-15T10:00:00.000Z',
            updatedAt: '2023-03-15T11:00:00.000Z',
        };
        expect(Note.mapRawToNote(rawData)).toEqual(expectedNote);
    });
  });
});
