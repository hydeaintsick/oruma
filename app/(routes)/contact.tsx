import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TextInput, SafeAreaView, ScrollView, Button as NativeButton, Alert, FlatList } from "react-native"; // Added FlatList
import { useLocalSearchParams, useRouter } from "expo-router";
import { Theme } from "@/constants";
import { Contact, ContactType, Note, NoteType, NoteCategory } from "@/db";
import NoteItem from "@/components/ui/NoteItem"; // Import NoteItem directly

export default function ContactScreen() {
  const params = useLocalSearchParams<{ contactId?: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<ContactType | null>(null);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newNoteText, setNewNoteText] = useState('');
  // Defaulting to 'PERSONAL'. A picker could be added later for category selection.
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("PERSONAL");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const loadContactDetails = async (contactId: string) => {
    try {
      const id = parseInt(contactId, 10);
      if (isNaN(id)) {
        setError("Invalid contact ID format.");
        setLoading(false);
        return;
      }
      const fetchedContact = await Contact.getById(id);
      if (fetchedContact) {
        setContact(fetchedContact);
        await loadNotes(fetchedContact.id); // Load notes after contact is set
      } else {
        setError("Contact not found.");
      }
    } catch (e) {
      console.error("Failed to load contact:", e);
      setError("Failed to load contact details.");
    } finally {
      // setLoading(false) will be called after notes are also loaded or attempt to load.
    }
  };

  const loadNotes = async (currentContactId: number) => {
    try {
      const fetchedNotes = await Note.getByUserId(currentContactId);
      // The existing Note.getByUserId doesn't sort, if needed, sort here or add a sorted DB call.
      // For now, accept the order from DB (likely by ID or insertion order if not specified)
      // Or sort by createdAt descending:
      fetchedNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(fetchedNotes);
    } catch (e) {
      console.error("Failed to load notes:", e);
      setError(prevError => prevError ? prevError + " Failed to load notes." : "Failed to load notes.");
    }
  };

  useEffect(() => {
    setLoading(true);
    if (params.contactId) {
      loadContactDetails(params.contactId)
        .finally(() => setLoading(false));
    } else {
      setError("No contact ID provided.");
      setLoading(false);
    }
  }, [params.contactId]);

  const handleSaveNote = async () => {
    if (!contact || typeof contact.id !== 'number') {
      Alert.alert("Error", "Contact details not loaded properly.");
      return;
    }
    if (newNoteText.trim() === "") {
      Alert.alert("Empty Note", "Please enter some text for your note.");
      return;
    }

    setIsSavingNote(true);
    try {
      await Note.create({
        userId: contact.id,
        content: newNoteText.trim(),
        category: newNoteCategory, // Currently defaulted, could be from a picker
      });
      setNewNoteText(''); // Clear input
      // setNewNoteCategory("PERSONAL"); // Reset category if it were selectable
      await loadNotes(contact.id); // Refresh notes list
      Alert.alert("Success", "Note saved!");
    } catch (e) {
      console.error("Failed to save note:", e);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.pageCentered}>
        <Text style={styles.messageText}>Loading contact details...</Text>
      </View>
    );
  }

  if (error && !contact) { // Show full page error only if contact hasn't been loaded
    return (
      <View style={styles.pageCentered}>
        <Text style={styles.messageText}>{error}</Text>
        <NativeButton title="Go Back" onPress={() => router.back()} color={Theme.colors.yellow} />
      </View>
    );
  }

  if (!contact) { // Should be covered by error state if loading is false
    return (
      <View style={styles.pageCentered}>
        <Text style={styles.messageText}>Contact data is unavailable.</Text>
        <NativeButton title="Go Back" onPress={() => router.back()} color={Theme.colors.yellow} />
      </View>
    );
  }

  // If there was an error loading notes, but contact is available, show it.
  const notesError = error && error.includes("Failed to load notes") ? error : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.contactName}>
            {contact.firstName} {contact.lastName?.toUpperCase()}
          </Text>
          <Text style={styles.categoryText}>Contact Category: {contact.category}</Text>
          {contact.nativeID && <Text style={styles.detailText}>Native ID: {contact.nativeID}</Text>}
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Add New Note</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your note here..."
            placeholderTextColor={Theme.colors.lightGray}
            value={newNoteText}
            onChangeText={setNewNoteText}
            multiline
          />
          {/* Basic Category Info - For a real app, use a Picker or similar */}
          <Text style={styles.detailTextSmall}>Category for new note: {newNoteCategory}</Text>
          <NativeButton
            title={isSavingNote ? "Saving..." : "Save Note"}
            onPress={handleSaveNote}
            disabled={isSavingNote || newNoteText.trim() === ""}
            color={Theme.colors.green}
          />

          <Text style={styles.sectionTitle}>Saved Notes</Text>
          {notesError && !loading && <Text style={styles.errorMessage}>{notesError}</Text>}

          <FlatList
            data={notes}
            renderItem={({ item }) => <NoteItem note={item} />}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={!loading && !notesError ? <Text style={styles.noNotesText}>No notes for this contact yet.</Text> : null}
            contentContainerStyle={notes.length === 0 ? styles.emptyListContainer : null}
            // Add some padding or margin to the FlatList itself if needed
            // style={styles.notesFlatList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (keep existing styles)
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.purple,
  },
  page: {
    flex: 1,
    backgroundColor: Theme.colors.purple,
    padding: 20,
  },
  pageCentered: { // For loading/error states
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.purple,
    padding: 20,
  },
  header: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: Theme.colors.lightPurple, // A slightly lighter shade for the header
    borderRadius: 10,
    alignItems: 'flex-start', // Align items to the start for a cleaner look
  },
  contactName: {
    fontSize: 28, // Increased size
    fontWeight: "bold",
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
    marginBottom: 8, // Increased margin
  },
  categoryText: {
    fontSize: 18, // Increased size
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.lightGray, // Lighter color for secondary info
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.lightGray,
    marginBottom: 5,
  },
  detailTextSmall: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.lightGray,
    marginBottom: 10,
    marginTop: 5,
  },
  notesSection: {
    width: '100%',
    flex: 1, // Ensure notes section can grow
    marginBottom: 20, // Add some bottom margin for overall page scroll
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.white,
    marginBottom: 12,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightGray,
    paddingBottom: 5,
  },
  textInput: {
    backgroundColor: Theme.colors.deepPurple,
    color: Theme.colors.white,
    padding: 10,
    borderRadius: 5,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
  },
  // Removed placeholderNote, placeholderText, placeholderTextTitle, placeholderTextDate
  // as NoteItem handles its own styling.
  messageText: {
    fontSize: 18,
    color: Theme.colors.white,
    fontFamily: Theme.fonts.regular,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorMessage: {
    color: Theme.colors.red, // Standard error color
    fontFamily: Theme.fonts.regular,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  noNotesText: {
    color: Theme.colors.lightGray, // Gentle color for empty state
    fontFamily: Theme.fonts.regular,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20, // Give some space when it's the only thing in the list area
    paddingBottom: 20, // Also padding if it's the last item
  },
  emptyListContainer: {
    flexGrow: 1, // Allows content to be centered if list is short or empty
    justifyContent: 'center', // Center the empty message
    alignItems: 'center',
  },
  // notesFlatList: { // Optional: if FlatList itself needs specific styling
  //   flex: 1, // Ensure it takes up available space within notesSection
  // }
});
