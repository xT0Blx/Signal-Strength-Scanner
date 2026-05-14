import React from "react";
import { View, StyleSheet } from "react-native";
import { SignalLevel } from "@/hooks/useWifiScan";
import { useColors } from "@/hooks/useColors";

interface SignalBarsProps {
  level: SignalLevel;
  size?: "sm" | "md" | "lg";
}

const LEVEL_MAP: Record<SignalLevel, number> = {
  excellent: 5,
  good: 4,
  fair: 3,
  weak: 2,
  poor: 1,
};

export function SignalBars({ level, size = "md" }: SignalBarsProps) {
  const colors = useColors();
  const filled = LEVEL_MAP[level];

  const signalColor = {
    excellent: colors.excellent,
    good: colors.good,
    fair: colors.fair,
    weak: colors.weak,
    poor: colors.poor,
  }[level];

  const barCount = 5;
  const sizeConfig = {
    sm: { width: 5, gap: 2, maxHeight: 16 },
    md: { width: 7, gap: 3, maxHeight: 24 },
    lg: { width: 9, gap: 4, maxHeight: 32 },
  }[size];

  return (
    <View style={[styles.container, { gap: sizeConfig.gap }]}>
      {Array.from({ length: barCount }).map((_, i) => {
        const barIndex = i + 1;
        const isFilled = barIndex <= filled;
        const heightPercent = 0.4 + (i / (barCount - 1)) * 0.6;
        const barHeight = Math.round(sizeConfig.maxHeight * heightPercent);

        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                width: sizeConfig.width,
                height: barHeight,
                backgroundColor: isFilled ? signalColor : colors.border,
                borderRadius: 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bar: {
    borderRadius: 2,
  },
});
