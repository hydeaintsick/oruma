import { Theme } from "@/constants";
import { StyleSheet, View, Text } from "react-native";

export default function ContactsScreen() {
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
