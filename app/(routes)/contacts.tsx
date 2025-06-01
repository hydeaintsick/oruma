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
import { TContactType as ContactCategoryType } from "@/types"; // Renamed for clarity
import { useRouter } from "expo-router";
import { useContacts } from "@/hooks";
import { ContactType } from "@/db"; // Import the actual ContactType from db

export default function ContactsScreen() {
  const { contacts } = useContacts(); // This is ContactType[] from db/Contact.ts
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<ContactCategoryType>("ALL"); // This TContactType is for category
  const [s, setSearch] = useState("");

  const search = s.toLowerCase();

  const displayContacts = contacts.filter((c: ContactType) => {
    const nameMatches =
      c.firstName.toLowerCase().includes(search) ||
      (c.lastName && c.lastName.toLowerCase().includes(search));
    if (currentTab === "ALL") {
      return nameMatches;
    }
    return c.category === currentTab && nameMatches;
  });

  function onTabPress(tab: ContactCategoryType) {
    setCurrentTab(tab);
  }

  // Updated onContact function
  function onContact(contact: ContactType) {
    if (contact && typeof contact.id === 'number') {
      router.navigate({ pathname: "/contact", params: { contactId: contact.id.toString() } });
    } else {
      console.error("Invalid contact data for navigation:", contact);
      // Optionally, show an error to the user
    }
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
          <Button
            label="New Contact"
            style={styles.newBtn}
            fontSize={14}
            bgColor={Theme.colors.green}
            onPress={() => router.navigate("/new-contact")} // Or the path to your new contact screen/modal
          />
        </View>
        {/* Component corpus */}
        <View style={styles.corpus}>
          <ScrollView>
            {displayContacts.map((contact: ContactType) => ( // Use ContactType here
              <ListContact
                key={contact.id} // Assuming contact.id is number (PK from DB)
                contact={contact} // Pass the whole ContactType object
                onPress={() => onContact(contact)} // Pass the specific contact to onContact
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
