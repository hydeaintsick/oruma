import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditContactScreen from './edit-contact'; // The component
import { Contact, ContactCategory, ContactType } from '@/db/Contact'; // Model and enum

// Mock useRouter and useLocalSearchParams
const mockNavigate = jest.fn();
const mockReplace = jest.fn(); // Used in edit screen
const mockBack = jest.fn();
const mockRouter = {
  navigate: mockNavigate,
  replace: mockReplace,
  back: mockBack,
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: jest.fn(),
}));
const mockUseLocalSearchParams = require('expo-router').useLocalSearchParams;

// Mock DB operations
jest.mock('@/db/Contact');

// Mock Alert.alert
jest.spyOn(Alert, 'alert');

// Mock Picker (similar to new-contact.test.tsx)
jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    // @ts-ignore
    class MockPicker extends React.Component {
      render() {
        // @ts-ignore
        const { children, selectedValue, onValueChange, ...props } = this.props;
        return (
          <mock-Picker {...props} selectedValue={selectedValue}>
            {React.Children.map(children, child =>
              React.cloneElement(child, {
                // @ts-ignore
                onPress: () => onValueChange(child.props.value, child.props.itemIndex)
            }))}
          </mock-Picker>
        );
      }
    }
    // @ts-ignore
    MockPicker.Item = ({ label, value, ...props }) => <mock-Picker.Item {...props} label={label} value={value} />;
    return { Picker: MockPicker };
  });

const mockContactId = '1';
const mockExistingContact: ContactType = {
  id: 1,
  firstName: 'Existing',
  lastName: 'User',
  category: ContactCategory.WORK,
  nativeID: 'exist-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  noteCount: 0, // Not directly used by edit form but part of type
};

describe('EditContactScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ contactId: mockContactId });
    (Contact.getById as jest.Mock).mockResolvedValue(mockExistingContact);
    (Contact.update as jest.Mock).mockResolvedValue(true); // Assume update is successful
  });

  it('should show loading state initially then pre-fill form with contact data', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<EditContactScreen />);

    // Check for loading indicator text (or ActivityIndicator testID if preferred)
    expect(getByText('Loading Contact...')).toBeTruthy();

    // Wait for data to load and form to be populated
    await waitFor(() => {
      expect(getByPlaceholderText('First Name').props.value).toBe(mockExistingContact.firstName);
    });
    expect(getByPlaceholderText('Last Name (Optional)').props.value).toBe(mockExistingContact.lastName);
    // Check if Picker's selectedValue is correctly set (mock dependent)
    // For our mock, we might check if the text of the selected category is rendered.
    expect(getByText(mockExistingContact.category)).toBeTruthy();
    expect(queryByText('Loading Contact...')).toBeNull(); // Loading text should disappear
  });

  it('should handle contact not found', async () => {
    (Contact.getById as jest.Mock).mockResolvedValue(null);
    render(<EditContactScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Contact not found.');
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('should update contact details on save', async () => {
    const { getByPlaceholderText, getByText } = render(<EditContactScreen />);
    await waitFor(() => expect(getByPlaceholderText('First Name').props.value).toBe(mockExistingContact.firstName)); // Ensure loaded

    const newFirstName = 'UpdatedFirstName';
    const newLastName = 'UpdatedLastName';
    // const newCategory = ContactCategory.FAMILY; // For Picker interaction test

    fireEvent.changeText(getByPlaceholderText('First Name'), newFirstName);
    fireEvent.changeText(getByPlaceholderText('Last Name (Optional)'), newLastName);
    // Simulate Picker change - conceptual as in new-contact.test.tsx
    // act(() => { getByText(newCategory).parent.props.onValueChange(newCategory); });


    const saveButton = getByText('Save Changes');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(Contact.update).toHaveBeenCalledWith(mockExistingContact.id, {
      firstName: newFirstName,
      lastName: newLastName,
      category: mockExistingContact.category, // Stays same if Picker not changed
    });
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Contact updated successfully!');
    expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/contact",
        params: { contactId: mockExistingContact.id.toString() }
    });
  });

  it('should show validation error if first name is empty on save', async () => {
    const { getByPlaceholderText, getByText } = render(<EditContactScreen />);
    await waitFor(() => expect(getByPlaceholderText('First Name').props.value).toBe(mockExistingContact.firstName));

    fireEvent.changeText(getByPlaceholderText('First Name'), ' '); // Empty first name

    const saveButton = getByText('Save Changes');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(Contact.update).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'First name is required.');
  });

  it('should call router.back() on cancel', async () => {
    const { getByText } = render(<EditContactScreen />);
    await waitFor(() => expect(getByText('Edit Contact')).toBeTruthy()); // Wait for screen title/content

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);
    expect(mockBack).toHaveBeenCalled();
  });

  it('should handle invalid contactId param', async () => {
    mockUseLocalSearchParams.mockReturnValueOnce({ contactId: 'invalid-id' });
    render(<EditContactScreen />);
    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid contact ID.');
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('should handle no contactId param', async () => {
    mockUseLocalSearchParams.mockReturnValueOnce({}); // No contactId
    render(<EditContactScreen />);
    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'No contact ID provided.');
    });
    expect(mockBack).toHaveBeenCalled();
  });
});
