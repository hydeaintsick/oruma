import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Dimensions, SafeAreaView } from "react-native";
import { Theme } from "@/constants";

export default function ContactScreen() {
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
