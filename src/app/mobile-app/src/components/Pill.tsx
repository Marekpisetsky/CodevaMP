import type { ReactNode } from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

type PillProps = {
  children: ReactNode;
  tone?: "default" | "accent" | "success";
};

export function Pill({ children, tone = "default" }: PillProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
});

const toneStyles = StyleSheet.create({
  default: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  accent: {
    backgroundColor: colors.accent,
  },
  success: {
    backgroundColor: colors.success,
  },
});