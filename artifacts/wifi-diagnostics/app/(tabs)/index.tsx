import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useWifiScan, WifiNetwork } from "@/hooks/useWifiScan";
import { NetworkCard } from "@/components/NetworkCard";

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { networks, status, errorMessage, lastScanTime, scan } = useWifiScan();

  const isScanning = status === "scanning" || status === "requesting";

  const handleScan = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scan();
  }, [scan]);

  const formatScanTime = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusText = () => {
    switch (status) {
      case "requesting": return "Requesting permissions...";
      case "scanning": return "Scanning networks...";
      case "done": return `${networks.length} network${networks.length !== 1 ? "s" : ""} found`;
      case "error": return "Scan failed";
      case "unavailable": return "Not available";
      default: return "Ready to scan";
    }
  };

  const statusColor = () => {
    switch (status) {
      case "done": return colors.excellent;
      case "error":
      case "unavailable": return colors.poor;
      case "scanning":
      case "requesting": return colors.primary;
      default: return colors.mutedForeground;
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons
            name="access-point-network"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Wi-Fi Diagnostics
          </Text>
        </View>
        <View style={styles.headerMeta}>
          <View style={[styles.statusDot, { backgroundColor: statusColor() }]} />
          <Text style={[styles.statusText, { color: statusColor() }]}>
            {statusText()}
          </Text>
          {lastScanTime && (
            <Text style={[styles.scanTime, { color: colors.mutedForeground }]}>
              · {formatScanTime(lastScanTime)}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        data={networks}
        keyExtractor={(item: WifiNetwork) => item.id}
        renderItem={({ item }) => <NetworkCard network={item} />}
        scrollEnabled={networks.length > 0}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad + 120, flexGrow: 1 },
        ]}
        ListEmptyComponent={
          <EmptyState
            status={status}
            errorMessage={errorMessage}
            colors={colors}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={handleScan}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.fabContainer, { bottom: bottomPad + 70 }]}>
        <TouchableOpacity
          style={[
            styles.scanButton,
            {
              backgroundColor: isScanning ? colors.muted : colors.primary,
              borderRadius: 32,
            },
          ]}
          onPress={handleScan}
          disabled={isScanning}
          activeOpacity={0.8}
          testID="scan-button"
        >
          {isScanning ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <MaterialCommunityIcons
              name="wifi-refresh"
              size={22}
              color={colors.primaryForeground}
            />
          )}
          <Text style={[styles.scanButtonText, { color: colors.primaryForeground }]}>
            {isScanning ? "Scanning..." : networks.length > 0 ? "Re-scan" : "Scan Networks"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({
  status,
  errorMessage,
  colors,
}: {
  status: string;
  errorMessage: string;
  colors: any;
}) {
  if (status === "scanning" || status === "requesting") {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Scanning...
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Looking for nearby Wi-Fi networks
        </Text>
      </View>
    );
  }

  if (status === "error" || status === "unavailable") {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name={status === "unavailable" ? "wifi-off" : "alert-circle-outline"}
          size={48}
          color={status === "unavailable" ? colors.mutedForeground : colors.poor}
        />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {status === "unavailable" ? "Unavailable" : "Scan Failed"}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: colors.mutedForeground, textAlign: "center" },
          ]}
        >
          {errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="access-point-network"
        size={56}
        color={colors.mutedForeground}
        style={{ opacity: 0.4 }}
      />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No Results Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Tap "Scan Networks" to detect{"\n"}nearby Wi-Fi access points
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scanTime: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  list: { flex: 1 },
  listContent: { paddingTop: 12 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
