import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Theme } from "@/constants";
import { ListContact, Button, Searchbar } from "@/components";
import { TContactType } from "@/types";
import { useRouter } from "expo-router";
import { useContacts } from "@/hooks";

export default function ContactsScreen() {
  const { contacts } = useContacts();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<TContactType>("ALL");
  const [s, setSearch] = useState("");

  const search = s.toLowerCase();

  const displayContacts = contacts.filter(
    (c) =>
      c.category === currentTab &&
      (c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search))
  );

  function onTabPress(tab: TContactType) {
    setCurrentTab(tab);
  }

  function onContact() {
    router.navigate("/contact");
  }

  return (
    <View style={styles.page}>
      <SafeAreaView>
        <Searchbar label="Rechercher dans les contacts" onSearch={setSearch} />
        {/* Buttons zone */}
        <View style={styles.actions}>
          <Button
            label="⭐"
            fontSize={12}
            style={styles.action}
            bgColor={Theme.colors.yellow}
            markedup={currentTab === "ALL"}
            onPress={() => onTabPress("ALL")}
          />
          <Button
            label="❤️"
            style={[styles.action, { marginLeft: 8 }]}
            fontSize={12}
            bgColor={Theme.colors.red}
            markedup={currentTab === "FRIEND"}
            onPress={() => onTabPress("FRIEND")}
          />
          <Button
            label="💻"
            fontSize={12}
            style={[styles.action, { marginLeft: 8 }]}
            bgColor={Theme.colors.grey}
            markedup={currentTab === "WORK"}
            onPress={() => onTabPress("WORK")}
          />
          <Button
            label="🏠"
            fontSize={12}
            style={[styles.action, { marginLeft: 8 }]}
            bgColor={Theme.colors.blue}
            markedup={currentTab === "FAMILY"}
            onPress={() => onTabPress("FAMILY")}
          />
          {/* <Button
            label="Nouveau"
            style={styles.newBtn}
            fontSize={14}
            bgColor={Theme.colors.green}
          /> */}
        </View>
        {/* Component corpus */}
        <View style={styles.corpus}>
          <ScrollView>
            {displayContacts.map((contact: any) => (
              <ListContact
                key={contact.id}
                contact={contact}
                onPress={onContact}
              />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
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
  // corpus component
  corpus: {
    flex: 1,
    width: Dimensions.get("window").width - 40,
    maxHeight: "80%",
    borderRadius: 25,
    backgroundColor: Theme.colors.yellow,
    borderWidth: 10,
    borderColor: Theme.colors.white,
    paddingLeft: 10,
    paddingRight: 10,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 20,
  },
  action: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 8,
    alignItems: "center",
    padding: 0,
    position: "relative",
  },
  newBtn: {
    // width: "100%",
    flex: 1,
    marginLeft: 8,
    borderWidth: 6,
    padding: 0,
    maxHeight: 45,
    alignItems: "center",
    width: Dimensions.get("window").width - 40 - 180 - 32,
  },
});
