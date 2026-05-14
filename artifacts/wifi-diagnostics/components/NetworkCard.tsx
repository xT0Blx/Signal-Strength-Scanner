import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  WifiNetwork,
  rssiToLevel,
  frequencyToBand,
  parseSecurityType,
} from "@/hooks/useWifiScan";
import { SignalBars } from "@/components/SignalBars";

interface NetworkCardProps {
  network: WifiNetwork;
}

export function NetworkCard({ network }: NetworkCardProps) {
  const colors = useColors();
  const level = rssiToLevel(network.level);
  const band = frequencyToBand(network.frequency);
  const security = parseSecurityType(network.capabilities);
  const isOpen = security === "Open";

  const levelColors: Record<string, string> = {
    excellent: colors.excellent,
    good: colors.good,
    fair: colors.fair,
    weak: colors.weak,
    poor: colors.poor,
  };

  const levelLabels: Record<string, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    weak: "Weak",
    poor: "Poor",
  };

  const signalColor = levelColors[level];
  const levelLabel = levelLabels[level];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.ssidRow}>
          <MaterialCommunityIcons
            name={isOpen ? "wifi" : "wifi-lock"}
            size={18}
            color={colors.subtext}
            style={styles.wifiIcon}
          />
          <Text
            style={[styles.ssid, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {network.SSID}
          </Text>
        </View>
        <View style={styles.signalSection}>
          <SignalBars level={level} size="md" />
          <Text style={[styles.levelLabel, { color: signalColor }]}>
            {levelLabel}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailsGrid}>
        <DetailItem
          label="BSSID"
          value={network.BSSID}
          colors={colors}
          mono
        />
        <DetailItem
          label="RSSI"
          value={`${network.level} dBm`}
          colors={colors}
          valueColor={signalColor}
        />
        <DetailItem
          label="Band"
          value={band}
          colors={colors}
        />
        <DetailItem
          label="Security"
          value={security}
          colors={colors}
          valueColor={isOpen ? colors.weak : colors.good}
        />
      </View>
    </View>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  colors: any;
  mono?: boolean;
  valueColor?: string;
}

function DetailItem({ label, value, colors, mono, valueColor }: DetailItemProps) {
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          { color: valueColor ?? colors.foreground },
          mono && styles.mono,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ssidRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  wifiIcon: {
    marginRight: 8,
  },
  ssid: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  signalSection: {
    alignItems: "center",
    gap: 4,
  },
  levelLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailItem: {
    minWidth: "45%",
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  mono: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
