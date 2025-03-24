import { Theme } from "@/constants";
import { useContacts } from "@/hooks";
import { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";

export default function ContactsScreen() {
  const { contacts } = useContacts();

  useEffect(() => {
    console.log(contacts);
  }, [contacts]);

  return (
    <View style={styles.page}>
      <Text>Contacts</Text>
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
});
