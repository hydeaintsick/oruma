import { Contact, ContactCategory, initDB, ContactTypeRaw } from './Contact'; // Adjusted import for ContactTypeRaw
// It seems initDB from Contact.ts also initializes Note table, which is fine for this mocked setup.

// Mocking expo-sqlite more comprehensively
const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockExecuteSql = jest.fn(); // For synchronous transactions if any part of initDB uses them

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
  // If initDB uses synchronous transactions:
  transaction: jest.fn((callback) => {
    callback({ executeSql: mockExecuteSql });
  }),
  // Add other methods like closeAsync, deleteAsync if needed
};

// @ts-ignore openDatabase is not defined in Node.js for Jest
global.openDatabase = jest.fn(() => mockDB);

describe('ContactModel (db/Contact.ts)', () => {
  beforeAll(async () => {
    // Mock implementation for initDB's table creation calls
    // Assuming initDB uses executeSql for table creation within a transaction
    mockExecuteSql.mockImplementation((sql) => {
      // console.log("Mocked executeSql:", sql);
      return { rows: [], rowsAffected: 0 }; // Default mock for DDL
    });
    // If initDB uses runAsync for table creation:
    mockRunAsync.mockImplementation((sql) => {
      // console.log("Mocked runAsync for DDL:", sql);
      return Promise.resolve({ insertId: undefined, rowsAffected: 0 });
    });

    await initDB(); // This will call Contact.createTable() etc.
    // Clear specific mocks for DDL after initDB if they were set
    mockExecuteSql.mockReset();
    mockRunAsync.mockReset();
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockRunAsync.mockReset();
    mockGetFirstAsync.mockReset();
    mockGetAllAsync.mockReset();
    mockExecuteSql.mockReset();
    // mockDB.transactionAsync.mockClear(); // If you need to check transaction calls themselves
  });

  describe('create()', () => {
    it('should create a contact with all fields and correct timestamps', async () => {
      const now = Date.now();
      const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
      const isoNow = new Date(now).toISOString();

      mockRunAsync.mockResolvedValueOnce({ insertId: 1, rowsAffected: 1 });

      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        category: ContactCategory.FRIEND,
        nativeID: 'native-123',
      };
      const newContactId = await Contact.create(contactData);

      expect(newContactId).toBe(1);
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO contacts (firstName, lastName, category, nativeID, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          contactData.firstName,
          contactData.lastName,
          contactData.category,
          contactData.nativeID,
          isoNow, // createdAt
          isoNow, // updatedAt
        ]
      );
      spyDateNow.mockRestore();
    });

    it('should create a contact with only required fields (firstName, category)', async () => {
      const now = Date.now();
      const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
      const isoNow = new Date(now).toISOString();
      mockRunAsync.mockResolvedValueOnce({ insertId: 2, rowsAffected: 1 });

      const contactData = {
        firstName: 'Jane',
        category: ContactCategory.WORK,
      };
      // @ts-ignore - testing with only required fields
      const newContactId = await Contact.create(contactData);

      expect(newContactId).toBe(2);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO contacts (firstName, lastName, category, nativeID, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          contactData.firstName,
          null, // lastName
          contactData.category,
          null, // nativeID
          isoNow,
          isoNow,
        ]
      );
      spyDateNow.mockRestore();
    });
  });

  describe('update()', () => {
    it('should update all provided fields and set updatedAt', async () => {
      const now = Date.now();
      const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
      const isoNow = new Date(now).toISOString();
      const contactId = 1;
      const updateData = {
        firstName: 'Johnathan',
        lastName: 'Doelicious',
        category: ContactCategory.FAMILY,
        nativeID: 'native-updated-456',
      };

      // Mock getFirstAsync for fetching the existing record
      const existingContactRaw: ContactTypeRaw = {
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        category: ContactCategory.FRIEND,
        nativeID: 'native-123',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      };
      mockGetFirstAsync.mockResolvedValueOnce(existingContactRaw);
      mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 });

      await Contact.update(contactId, updateData);

      expect(mockGetFirstAsync).toHaveBeenCalledWith('SELECT * FROM contacts WHERE id = ?', [contactId]);
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'UPDATE contacts SET firstName = ?, lastName = ?, category = ?, nativeID = ?, updatedAt = ? WHERE id = ?',
        [
          updateData.firstName,
          updateData.lastName,
          updateData.category,
          updateData.nativeID,
          isoNow, // updatedAt
          contactId,
        ]
      );
      spyDateNow.mockRestore();
    });

    it('should handle partial updates, preserving existing values for non-provided fields', async () => {
      const now = Date.now();
      const spyDateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
      const isoNow = new Date(now).toISOString();
      const contactId = 1;
      const partialUpdateData = {
        firstName: 'Johnny',
        // lastName, category, nativeID not provided
      };

      const existingContactRaw: ContactTypeRaw = {
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        category: ContactCategory.FRIEND,
        nativeID: 'native-123',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      };
      mockGetFirstAsync.mockResolvedValueOnce(existingContactRaw);
      mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 });

      await Contact.update(contactId, partialUpdateData);

      expect(mockGetFirstAsync).toHaveBeenCalledWith('SELECT * FROM contacts WHERE id = ?', [contactId]);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'UPDATE contacts SET firstName = ?, lastName = ?, category = ?, nativeID = ?, updatedAt = ? WHERE id = ?',
        [
          partialUpdateData.firstName, // updated
          existingContactRaw.lastName, // preserved
          existingContactRaw.category, // preserved
          existingContactRaw.nativeID, // preserved
          isoNow, // new updatedAt
          contactId,
        ]
      );
      spyDateNow.mockRestore();
    });

    it('should return false if contact to update is not found', async () => {
        mockGetFirstAsync.mockResolvedValueOnce(null); // Simulate contact not found
        const success = await Contact.update(999, { firstName: 'Ghost' });
        expect(success).toBe(false);
        expect(mockRunAsync).not.toHaveBeenCalled(); // Update should not be attempted
      });
  });

  describe('deleteById()', () => {
    it('should delete a contact by ID', async () => {
      const contactId = 1;
      mockRunAsync.mockResolvedValueOnce({ rowsAffected: 1 });
      const success = await Contact.deleteById(contactId);

      expect(success).toBe(true);
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'DELETE FROM contacts WHERE id = ?',
        [contactId]
      );
    });

    it('should return false if contact to delete is not found or delete fails', async () => {
        mockRunAsync.mockResolvedValueOnce({ rowsAffected: 0 });
        const success = await Contact.deleteById(999);
        expect(success).toBe(false);
    });
  });

  describe('getById()', () => {
    it('should retrieve a contact by its ID', async () => {
      const contactId = 1;
      const mockContactRaw: ContactTypeRaw = {
        id: contactId,
        firstName: 'Test',
        lastName: 'User',
        category: ContactCategory.WORK,
        nativeID: 'native-789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockGetFirstAsync.mockResolvedValueOnce(mockContactRaw);

      const result = await Contact.getById(contactId);

      expect(result).toEqual(Contact.mapRawToContact(mockContactRaw)); // Assuming mapRawToContact is used
      expect(mockGetFirstAsync).toHaveBeenCalledTimes(1);
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId]
      );
    });

    it('should return null if contact not found', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);
      const result = await Contact.getById(999);
      expect(result).toBeNull();
    });
  });

  describe('getAllWithNoteCounts()', () => {
    it('should retrieve all contacts with their note counts, ordered by firstName', async () => {
      const mockRawData = [ // Data as it would come from SQLite.ts (noteCount is string)
        { id: 1, firstName: 'Alice', lastName: 'A', category: 'FRIEND', nativeID: 'n1', createdAt: '', updatedAt: '', noteCount: "2" },
        { id: 2, firstName: 'Bob', lastName: 'B', category: 'WORK', nativeID: 'n2', createdAt: '', updatedAt: '', noteCount: "0" },
      ];
      mockGetAllAsync.mockResolvedValueOnce(mockRawData);

      const results = await Contact.getAllWithNoteCounts();

      expect(results).toEqual(mockRawData.map(Contact.mapRawToContactWithNoteCount));
      expect(mockGetAllAsync).toHaveBeenCalledTimes(1);
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.*, COUNT(n.id) as noteCount FROM contacts c LEFT JOIN notes n ON c.id = n.userId GROUP BY c.id ORDER BY c.firstName ASC')
      );
    });
  });

  // Test for mapRawToContact if it's complex enough, though it's mostly type casting
  // Test for mapRawToContactWithNoteCount (handles parsing noteCount to number)
  describe('mapRawToContactWithNoteCount()', () => {
    it('should parse noteCount from string to number', () => {
        const raw = { id: 1, firstName: 'Test', noteCount: "5" } as any; // other fields omitted for brevity
        const mapped = Contact.mapRawToContactWithNoteCount(raw);
        expect(mapped.noteCount).toBe(5);
    });

    it('should handle null or undefined noteCount as 0', () => {
        const raw1 = { id: 1, firstName: 'Test', noteCount: null } as any;
        const mapped1 = Contact.mapRawToContactWithNoteCount(raw1);
        expect(mapped1.noteCount).toBe(0);

        const raw2 = { id: 1, firstName: 'Test', noteCount: undefined } as any;
        const mapped2 = Contact.mapRawToContactWithNoteCount(raw2);
        expect(mapped2.noteCount).toBe(0);
    });
  });

});
