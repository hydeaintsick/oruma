import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Dimensions, SafeAreaView } from "react-native";
import { Theme } from "@/constants";
import { useContacts } from "@/hooks";

export default function ContactScreen() {
  const { contacts } = useContacts();

  return (
    <View style={styles.page}>
      <Text>Page du contact</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.purple,
    padding: 20,
  },
});
