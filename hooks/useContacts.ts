import { useState, useEffect } from "react";
import * as Contacts from "expo-contacts";
import { Contact, ContactType } from "@/db";

export function useContacts() {
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await Contact.getAll();
        console.log("DATAAAAAAAAAA");
        console.log(data);
        setContacts(data);
      } catch (err) {
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
