import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TextInput, SafeAreaView, ScrollView, Button as NativeButton, Alert, FlatList, Modal, Pressable } from "react-native"; // Added FlatList, Modal, Pressable
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

  const [isDeletingContact, setIsDeletingContact] = useState(false); // State for delete operation
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("PERSONAL");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // State for editing a note
  const [editingNote, setEditingNote] = useState<NoteType | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedCategory, setEditedCategory] = useState<NoteCategory>('PERSONAL');

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
        await loadNotes(fetchedContact.id);
      } else {
        setError("Contact not found.");
      }
    } catch (e) {
      console.error("Failed to load contact:", e);
      setError("Failed to load contact details.");
    }
  };

  const loadNotes = async (currentContactId: number) => {
    try {
      const fetchedNotes = await Note.getByUserId(currentContactId);
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

  const handleDeletePress = (noteId: number) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Note.deleteById(noteId);
              await loadNotes(contact!.id);
              Alert.alert("Success", "Note deleted successfully.");
            } catch (e) {
              console.error("Failed to delete note:", e);
              Alert.alert("Error", "Failed to delete note.");
            }
          },
        },
      ]
    );
  };

  const handleEditPress = (note: NoteType) => {
    setEditingNote(note);
    setEditedContent(note.content);
    setEditedCategory(note.category);
  };

  const handleDeleteContactPress = () => {
    if (!contact) return;

    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contact.firstName} ${contact.lastName || ''}? This will also delete all associated notes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingContact(true);
            try {
              // First, delete all notes associated with the contact
              // Note: This assumes Note.deleteByUserId exists or is implemented.
              // If not, you might need to fetch notes and delete them one by one, or add a cascade delete in the DB.
              // For simplicity, let's assume Note.deleteByUserId handles this.
              // If Note.deleteByUserId does not exist, this will need adjustment.
              // await Note.deleteByUserId(contact.id); // This function needs to be implemented in db/Note.ts

              // As a workaround if Note.deleteByUserId isn't available,
              // and assuming notes are loaded:
              for (const note of notes) {
                await Note.deleteById(note.id);
              }

              await Contact.deleteById(contact.id);
              Alert.alert("Success", "Contact deleted successfully.");
              router.replace("/contacts"); // Navigate to contacts list
            } catch (e) {
              console.error("Failed to delete contact:", e);
              Alert.alert("Error", "Failed to delete contact.");
            } finally {
              setIsDeletingContact(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSaveEditedNote = async () => {
    if (!editingNote) return;

    if (editedContent.trim() === "") {
      Alert.alert("Empty Note", "Note content cannot be empty.");
      return;
    }

    setIsSavingNote(true);
    try {
      await Note.update(editingNote.id, {
        content: editedContent.trim(),
        category: editedCategory,
      });
      setEditingNote(null); // Close modal
      await loadNotes(contact!.id); // Refresh notes
      Alert.alert("Success", "Note updated successfully!");
    } catch (e) {
      console.error("Failed to update note:", e);
      Alert.alert("Error", "Failed to update note.");
    } finally {
      setIsSavingNote(false);
    }
  };


  const handleSaveNewNote = async () => {
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
        category: newNoteCategory,
      });
      setNewNoteText('');
      await loadNotes(contact.id);
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

  if (error && !contact) {
    return (
      <View style={styles.pageCentered}>
        <Text style={styles.messageText}>{error}</Text>
        <NativeButton title="Go Back" onPress={() => router.back()} color={Theme.colors.yellow} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.pageCentered}>
        <Text style={styles.messageText}>Contact data is unavailable.</Text>
        <NativeButton title="Go Back" onPress={() => router.back()} color={Theme.colors.yellow} />
      </View>
    );
  }

  const notesError = error && error.includes("Failed to load notes") ? error : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.contactName}>
              {contact.firstName} {contact.lastName?.toUpperCase()}
            </Text>
            <Text style={styles.categoryText}>Contact Category: {contact.category}</Text>
            {contact.nativeID && <Text style={styles.detailText}>Native ID: {contact.nativeID}</Text>}
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.editContactButton}
              onPress={() => router.navigate({ pathname: "/edit-contact", params: { contactId: contact.id.toString() }})}
              disabled={isDeletingContact}
            >
              <Text style={styles.editContactButtonText}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.deleteContactButton, isDeletingContact && styles.disabledButton]}
              onPress={handleDeleteContactPress}
              disabled={isDeletingContact}
            >
              <Text style={styles.deleteContactButtonText}>
                {isDeletingContact ? "Deleting..." : "Delete"}
              </Text>
            </Pressable>
          </View>
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
          <Text style={styles.detailTextSmall}>Category for new note: {newNoteCategory}</Text>
          <NativeButton
            title={isSavingNote ? "Saving..." : "Save Note"}
            onPress={handleSaveNewNote}
            disabled={isSavingNote || newNoteText.trim() === ""}
            color={Theme.colors.green}
          />

          <Text style={styles.sectionTitle}>Saved Notes</Text>
          {notesError && !loading && <Text style={styles.errorMessage}>{notesError}</Text>}

          <FlatList
            data={notes}
            renderItem={({ item }) => (
              <NoteItem
                note={item}
                onEditPress={handleEditPress}
                onDeletePress={handleDeletePress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={!loading && !notesError ? <Text style={styles.noNotesText}>No notes for this contact yet.</Text> : null}
            contentContainerStyle={notes.length === 0 ? styles.emptyListContainer : null}
          />
        </View>
      </ScrollView>

      {editingNote && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editingNote !== null}
          onRequestClose={() => setEditingNote(null)}
        >
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
              />
              {/* Basic Category Picker - Consider a more robust solution for more categories */}
              <View style={styles.categoryPickerContainer}>
                {(Object.keys(NoteCategory) as Array<keyof typeof NoteCategory>).map((key) => (
                  <Pressable
                    key={key}
                    style={[
                      styles.categoryButton,
                      editedCategory === NoteCategory[key] && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setEditedCategory(NoteCategory[key])}
                  >
                    <Text style={styles.categoryButtonText}>{NoteCategory[key]}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.modalActions}>
                <NativeButton title="Cancel" onPress={() => setEditingNote(null)} color={Theme.colors.red} />
                <NativeButton title={isSavingNote ? "Saving..." : "Save Changes"} onPress={handleSaveEditedNote} disabled={isSavingNote} color={Theme.colors.green} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.purple,
  },
  page: {
    flex: 1,
    backgroundColor: Theme.colors.purple,
    padding: 20,
  },
  pageCentered: {
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
    backgroundColor: Theme.colors.lightPurple,
    borderRadius: 10,
    flexDirection: 'row', // Align items in a row
    justifyContent: 'space-between', // Space between text and button
    alignItems: 'center', // Center items vertically
  },
  headerTextContainer: {
    flex: 1, // Allow text to take available space
    marginRight: 10, // Add some space before the buttons
  },
  headerActions: {
    flexDirection: 'row',
  },
  editContactButton: {
    backgroundColor: Theme.colors.blue,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10, // Space between edit and delete buttons
  },
  editContactButtonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semiBold,
    fontSize: 14,
  },
  deleteContactButton: {
    backgroundColor: Theme.colors.red,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  deleteContactButtonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semiBold,
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  contactName: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 18,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.lightGray,
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
    flex: 1,
    marginBottom: 20,
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
  messageText: {
    fontSize: 18,
    color: Theme.colors.white,
    fontFamily: Theme.fonts.regular,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorMessage: {
    color: Theme.colors.red,
    fontFamily: Theme.fonts.regular,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  noNotesText: {
    color: Theme.colors.lightGray,
    fontFamily: Theme.fonts.regular,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    backgroundColor: Theme.colors.deepPurple, // Darker background for modal
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Modal width
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
    marginBottom: 15,
  },
  modalTextInput: {
    backgroundColor: Theme.colors.purple, // Lighter than modal background for contrast
    color: Theme.colors.white,
    padding: 10,
    borderRadius: 5,
    minHeight: 100, // Good height for editing
    textAlignVertical: 'top',
    marginBottom: 15,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    width: '100%', // Ensure it fills modal width
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: Theme.colors.lightPurple, // Default button look
  },
  categoryButtonSelected: {
    backgroundColor: Theme.colors.green, // Highlight for selected category
  },
  categoryButtonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semiBold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute buttons
    width: '100%', // Ensure actions take full width
  },
});
