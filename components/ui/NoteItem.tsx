import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NoteType } from '@/db'; // NoteType from db/index.ts which should export from db/Note.ts
import { Theme } from '@/constants';

interface NoteItemProps {
  note: NoteType;
  onEditPress?: (note: NoteType) => void;
  onDeletePress?: (noteId: number) => void;
}

const formatDate = (isoString: string) => {
  if (!isoString) return 'N/A';
  try {
    // Using a simpler toLocaleDateString and toLocaleTimeString for broader compatibility
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    console.error("Failed to format date:", isoString, e);
    return 'Invalid Date';
  }
};

export const NoteItem: React.FC<NoteItemProps> = ({ note, onEditPress, onDeletePress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.categoryText}>{note.category}</Text>
      <Text style={styles.contentText}>{note.content}</Text>
      <View style={styles.footer}>
        <Text style={styles.dateText}>Created: {formatDate(note.createdAt)}</Text>
        {note.updatedAt !== note.createdAt && (
          <Text style={styles.dateTextUpdated}>Updated: {formatDate(note.updatedAt)}</Text>
        )}
      </View>
      <View style={styles.actionsContainer}>
        {onEditPress &&
          <Pressable onPress={() => onEditPress(note)} style={[styles.button, styles.editButton]}>
            <Text style={styles.buttonText}>Edit</Text>
          </Pressable>
        }
        {onDeletePress &&
          <Pressable onPress={() => onDeletePress(note.id)} style={[styles.button, styles.deleteButton]}>
            <Text style={styles.buttonText}>Delete</Text>
          </Pressable>
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.deepPurple, // Using a theme color consistent with other inputs
    padding: 15,
    borderRadius: 8,
    marginBottom: 12, // Increased margin for better separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  contentText: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.white, // Ensure text is readable on deepPurple
    marginBottom: 10, // Space before footer
  },
  categoryText: {
    fontSize: 12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.lightGray, // Lighter color for category
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 5,
  },
  dateText: {
    fontSize: 11, // Slightly smaller for date
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.mediumGray, // Medium emphasis for dates
  },
  dateTextUpdated: {
    fontSize: 11,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.mediumGray,
    marginTop: 3, // Space if both dates are shown
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.lightPurple, // Separator for actions
    paddingTop: 10,
  },
  button: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semiBold,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: Theme.colors.blue, // Example color
  },
  deleteButton: {
    backgroundColor: Theme.colors.red, // Example color
  }
});

export default NoteItem;
