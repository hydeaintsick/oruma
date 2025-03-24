import { useState, useEffect } from "react";
import * as Contacts from "expo-contacts";

export const useContacts = () => {
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

export default useContacts;
