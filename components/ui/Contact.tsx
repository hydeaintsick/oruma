import { Theme } from "@/constants";
import { useRef } from "react";
import { Animated, Pressable, View, Text, StyleSheet } from "react-native";

export type TContact = {
  id: string;
  firstName: string;
  lastName: string;
};

export interface IListContactProps {
  contact: TContact;
  onPress?: (contact: TContact) => void;
}

export const ListContact = ({ contact, onPress }: IListContactProps) => {
  const { firstName, lastName } = contact;
  const initials = `${firstName[0]}${
    lastName[0]?.length > 0 ? lastName[0] : firstName[1]
  }`.toUpperCase();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress ? () => onPress(contact) : undefined}
    >
      <Animated.View
        style={[styles.contact, { transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.contactLeft}>
          <View style={styles.circle}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={{ marginLeft: 20 }}>
            <Text style={styles.contactName}>
              {contact.firstName} {contact.lastName?.toUpperCase()}
            </Text>
            <Text style={styles.notesNb}>10 notes</Text>
          </View>
        </View>
        <View style={styles.editBtn}>
          <Text style={styles.editBtnText}>Voir</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  contact: {
    width: "100%",
    height: 50,
    backgroundColor: Theme.colors.purple,
    marginTop: 8,
    padding: 8,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.lightPurple,
  },
  initials: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Theme.fonts.bold,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Theme.fonts.bold,
  },
  notesNb: {
    fontSize: 10,
    fontFamily: Theme.fonts.regular,
  },
  editBtn: {
    padding: 6,
    borderRadius: 5,
    backgroundColor: Theme.colors.lightPurple,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: Theme.fonts.semiBold,
  },
});
