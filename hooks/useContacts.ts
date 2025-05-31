import { useState, useEffect } from "react";
import * as Contacts from "expo-contacts";
import { Contact, ContactType } from "@/db"; // ContactType might need to be adjusted or a new type created if we frequently use the extended version.

// Define the extended contact type for clarity within this hook
export type ContactWithNoteCount = ContactType & { noteCount: number };

export function useContacts() {
  const [contacts, setContacts] = useState<ContactWithNoteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Call the new method to get contacts with note counts
        const data = await Contact.getAllWithNoteCounts();
        // The data is already sorted by lastName, firstName from the DB query
        setContacts(data);
      } catch (err) {
        console.error("Error in useContacts fetching data:", err); // Log the actual error
        setError("Erreur lors de la récupération des contacts.");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  return { contacts, loading, error };
}

export const usePhoneNativeContacts = () => {
  const [contacts, setContacts] = useState<any>([]);
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus>();

  useEffect(() => {
    const fetchContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Emails],
        });
        setContacts(data);
      }
    };

    fetchContacts();
  }, []);

  return { contacts, permissionStatus };
};

export const useLazyContacts = () => {
  const [contacts, setContacts] = useState<any>([]);
  const [permissionStatus, setPermissionStatus] =
    useState<Contacts.PermissionStatus>();
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);

    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails],
      });
      setContacts(data);
    }
    setLoading(false);
  };

  return { contacts, permissionStatus, loading, fetchContacts };
};

export default usePhoneNativeContacts;
