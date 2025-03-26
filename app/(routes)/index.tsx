import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Gecko, Button } from "@/components";
import { Theme } from "@/constants";
import { useLazyContacts } from "@/hooks/useContacts";
import { Contact } from "@/db";

export default function HomeScreen() {
  const router = useRouter();
  const { contacts, permissionStatus, loading, fetchContacts } =
    useLazyContacts();

  useEffect(() => {
    // console.log("contacts:", contacts);
    async function saveInDb() {
      await Contact.batchSave(
        contacts.map((c: any) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          nativeID: c.id,
          category: "ALL",
        }))
      );
    }

    async function checkDb() {
      const inDb = await Contact.getAll();
      console.log("CONTACT IN DB:", inDb);
    }

    if (contacts.length > 0) saveInDb();

    checkDb();
  }, [contacts]);

  async function onSyncContacts() {
    await fetchContacts();
    router.navigate("/contacts");
  }

  return (
    <View style={styles.page}>
      <Gecko />
      <Text style={styles.title}>オルーマ</Text>
      <Text style={styles.subtitle}>Oruma</Text>
      <Button
        label="Démarrer"
        bgColor={Theme.colors.yellow}
        onPress={onSyncContacts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.purple,
  },
  title: {
    fontSize: 50,
    fontFamily: Theme.fonts.regular,
  },
  subtitle: {
    fontSize: 40,
    fontFamily: Theme.fonts.bold,
  },
});
