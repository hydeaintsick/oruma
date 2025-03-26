import { Theme } from "@/constants";
import { useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";

export interface ISearchBarProps {
  label: string;
  bgColor?: string;
  labelColor?: string;
  fontSize?: number;
  style?: any;
  onPress?: () => void;
}

export const Searchbar = ({
  label,
  bgColor,
  labelColor,
  fontSize,
  style,
  onPress,
}: ISearchBarProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
        <Text
          style={[
            styles.label,
            {
              color: labelColor || "black",
              fontSize: fontSize || 16,
            },
          ]}
        >
          {label}
        </Text>
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
    borderWidth: 10,
  },
  label: {
    color: "white",
    fontWeight: "bold",
  },
});
