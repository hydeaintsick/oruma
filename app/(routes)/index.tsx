import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Gecko, Button } from "@/components";
import { Theme } from "@/constants";

export default function HomeScreen() {
  const router = useRouter();

  function onSyncContacts() {
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
