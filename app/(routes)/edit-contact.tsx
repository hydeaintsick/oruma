import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme } from '@/constants';
import { Contact, ContactCategory, ContactType } from '@/db';
import { Button as CustomButton } from '@/components/ui/Button';
import { Picker } from '@react-native-picker/picker';

export default function EditContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId?: string }>();
  const [contact, setContact] = useState<ContactType | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [category, setCategory] = useState<ContactCategory>('FRIEND');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (params.contactId) {
      const id = parseInt(params.contactId, 10);
      if (isNaN(id)) {
        Alert.alert('Error', 'Invalid contact ID.');
        router.back();
        return;
      }
      Contact.getById(id).then(fetchedContact => {
        if (fetchedContact) {
          setContact(fetchedContact);
          setFirstName(fetchedContact.firstName);
          setLastName(fetchedContact.lastName || '');
          setCategory(fetchedContact.category);
        } else {
          Alert.alert('Error', 'Contact not found.');
          router.back();
        }
      }).catch(err => {
        console.error("Failed to load contact for editing:", err);
        Alert.alert('Error', 'Failed to load contact details.');
        router.back();
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      Alert.alert('Error', 'No contact ID provided.');
      router.back();
      setIsLoading(false);
    }
  }, [params.contactId]);

  const handleUpdateContact = async () => {
    if (!contact) {
      Alert.alert('Error', 'Contact data is not loaded.');
      return;
    }
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await Contact.update(contact.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        category,
      });
      Alert.alert('Success', 'Contact updated successfully!');
      // Optionally, refresh the contact screen or contacts list if needed
      // For now, just go back. The contact screen should reload the details.
      router.replace({ pathname: "/contact", params: { contactId: contact.id.toString() } });
    } catch (error) {
      console.error('Failed to update contact:', error);
      Alert.alert('Error', 'Failed to update contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, styles.centered]}>
          <ActivityIndicator size="large" color={Theme.colors.white} />
          <Text style={styles.loadingText}>Loading Contact...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contact) {
    // This case should ideally be handled by the useEffect redirecting back
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, styles.centered]}>
          <Text style={styles.title}>Contact not found.</Text>
          <CustomButton label="Go Back" onPress={() => router.back()} bgColor={Theme.colors.grey} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <Text style={styles.title}>Edit Contact</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor={Theme.colors.lightGray}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name (Optional)"
          placeholderTextColor={Theme.colors.lightGray}
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.pickerLabel}>Category:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            style={styles.picker}
            onValueChange={(itemValue) => setCategory(itemValue as ContactCategory)}
            dropdownIconColor={Theme.colors.white}
          >
            {(Object.values(ContactCategory) as ContactCategory[]).map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} color={Theme.colors.black}/>
            ))}
          </Picker>
        </View>

        <CustomButton
          label={isSaving ? 'Saving...' : 'Save Changes'}
          onPress={handleUpdateContact}
          disabled={isSaving || isLoading}
          bgColor={Theme.colors.green}
          style={styles.saveButton}
        />

        <CustomButton
          label="Cancel"
          onPress={() => router.back()}
          bgColor={Theme.colors.red}
          style={styles.cancelButton}
          disabled={isSaving}
        />
      </View>
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
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Theme.colors.white,
    fontFamily: Theme.fonts.regular,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: Theme.colors.deepPurple,
    color: Theme.colors.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    borderWidth: 1,
    borderColor: Theme.colors.lightPurple,
  },
  pickerLabel: {
    fontSize: 16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.white,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: Theme.colors.deepPurple,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.lightPurple,
  },
  picker: {
    width: '100%',
    color: Theme.colors.white,
    height: 50,
  },
  saveButton: {
    width: '100%',
    marginTop: 10,
  },
  cancelButton: {
    width: '100%',
    marginTop: 15,
  },
});
