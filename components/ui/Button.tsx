import { Theme } from "@/constants";
import { useRef } from "react";
import { Animated, Pressable, Text, StyleSheet } from "react-native";

export interface IButtonProps {
  label: string;
  bgColor?: string;
  labelColor?: string;
  fontSize?: number;
  markedup?: boolean;
  style?: any;
  onPress?: () => void;
}

export const Button = ({
  label,
  bgColor,
  labelColor,
  fontSize,
  markedup,
  style,
  onPress,
}: IButtonProps) => {
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
            backgroundColor: bgColor || "blue",
            transform: [{ scale: scaleAnim }],
          },
          markedup && {
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 8,
            },
            shadowOpacity: 0.44,
            shadowRadius: 10.32,

            elevation: 16,
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
    padding: 10,
    width: 280,
    height: 60,
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
