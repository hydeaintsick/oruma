import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        header: () => null,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="contacts"
        options={{
          title: "Contacts",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          title: "Contact",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
