import { Theme } from "@/constants";
import { useRef, useState, useEffect } from "react";
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
} from "react-native";

export interface ISearchBarProps {
  label: string;
  bgColor?: string;
  labelColor?: string;
  fontSize?: number;
  style?: any;
  onPress?: () => void;
  onSearch?: (search: string) => void;
}

export const Searchbar = ({
  label,
  bgColor,
  labelColor,
  fontSize,
  style,
  onPress,
  onSearch,
}: ISearchBarProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<TextInput | null>(null);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
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
    onPress?.();
  };

  useEffect(() => {
    if (isTyping) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Petit délai pour s'assurer que le champ est bien monté
    }
  }, [isTyping]);

  function onSearchOpen() {
    setIsTyping(true);
    setSearch("");
  }

  function onChangeText(text: string) {
    setSearch(text);
    onSearch?.(text);
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onSearchOpen}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: bgColor || Theme.colors.yellow,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {isTyping ? (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={search}
            onChangeText={onChangeText}
            placeholder="Rechercher..."
            autoCorrect={false}
            onBlur={() => setIsTyping(false)}
            autoFocus={true} // Force l'ouverture du clavier
            returnKeyType="search" // Pour une meilleure UX
          />
        ) : (
          <Text
            style={[
              styles.label,
              {
                color: labelColor || "black",
                fontSize: fontSize || 16,
              },
            ]}
          >
            {search.length > 0 ? `Recherche:${search}` : label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: Dimensions.get("window").width - 40,
    height: 60,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    borderColor: "white",
    borderWidth: 2,
  },
  label: {
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: "100%",
    fontSize: 16,
    color: "black",
    paddingLeft: 8,
  },
});
