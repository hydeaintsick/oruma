import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Gecko, Button } from "@/components";
import { Theme } from "@/constants";
import { useLazyContacts } from "@/hooks/useContacts";
import { Contact } from "@/db";

export default function HomeScreen() {
  const router = useRouter();
  const {
    contacts: nativeContacts,
    permissionStatus,
    loading: nativeContactsLoading,
    fetchContacts
  } = useLazyContacts();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function saveInDb() {
      if (nativeContacts.length > 0) {
        console.log("useEffect: nativeContacts updated, attempting batchSave...");
        await Contact.batchSave(
          nativeContacts
            .map((c: any) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              nativeID: c.id, // Assuming c.id is the native contact ID
              category: "ALL", // Default category
            }))
            .filter((c: any) => c.firstName && c.nativeID) // Ensure essential fields
        );
        console.log("useEffect: batchSave completed.");
      }
    }
    // async function checkDb() {
    //   const inDb = await Contact.getAll();
    // }
    if (nativeContacts.length > 0) saveInDb();
    // checkDb(); // This was present, deciding if it's still needed or part of a different flow
  }, [nativeContacts]);

  async function onSyncContacts() {
    setIsSyncing(true);
    try {
      await fetchContacts(); // Fetches contacts and updates `nativeContacts`

      // nativeContacts state is updated by fetchContacts.
      // The useEffect above will be triggered by this change.
      // To ensure saving is complete before navigation for this specific action,
      // we will call batchSave directly here.

      console.log("onSyncContacts: fetchContacts completed. Contacts fetched:", nativeContacts.length);

      // We need to use the contacts returned by fetchContacts or from the state.
      // Since fetchContacts updates the state `nativeContacts` which useEffect listens to,
      // let's ensure we use the most current data.
      // The `fetchContacts` from `useLazyContacts` updates the `contacts` (now `nativeContacts`) state.
      // So, after `await fetchContacts()`, `nativeContacts` should be up-to-date.

      if (nativeContacts.length > 0) {
        console.log("onSyncContacts: Starting batchSave...");
        await Contact.batchSave(
          nativeContacts
            .map((c: any) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              nativeID: c.id,
              category: "ALL",
            }))
            .filter((c: any) => c.firstName && c.nativeID) // Ensure essential fields
        );
        console.log("onSyncContacts: batchSave completed.");
      } else if (permissionStatus === "granted") {
        console.log("onSyncContacts: No new contacts fetched or permission granted but no contacts on device.");
      } else {
        console.log("onSyncContacts: Permission not granted or contacts not fetched.");
      }

      router.navigate("/contacts");

    } catch (error) {
      console.error("Error during contact synchronization:", error);
      // Optionally, show an error message to the user here
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <View style={styles.page}>
      <Gecko />
      <Text style={styles.title}>オルーマ</Text>
      <Text style={styles.subtitle}>Oruma</Text>
      <Button
        label={isSyncing ? "Synchronisation..." : "Démarrer"}
        bgColor={Theme.colors.yellow}
        onPress={onSyncContacts}
        disabled={isSyncing || nativeContactsLoading}
      />
      {nativeContactsLoading && <Text style={{color: 'white', marginTop: 10}}>Chargement des contacts natifs...</Text>}
      {isSyncing && !nativeContactsLoading && <Text style={{color: 'white', marginTop: 10}}>Sauvegarde des contacts...</Text>}
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
