import { Theme } from "@/constants";
import { Pressable, Text, StyleSheet } from "react-native";

export interface IButtonProps {
  label: string;
  bgColor?: string;
  labelColor?: string;
  style?: any;
  onPress?: () => void;
}

export const Button = ({
  label,
  bgColor,
  labelColor,
  style,
  onPress,
}: IButtonProps) => {
  return (
    <Pressable
      style={[
        styles.btn,
        {
          backgroundColor: bgColor || "blue",
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          {
            color: labelColor || "black",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "blue",
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
    fontFamily: Theme.fonts.bold,
    fontSize: 16,
  },
});
