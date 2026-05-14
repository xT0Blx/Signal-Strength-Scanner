import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { loadHistory, ScanSession, avgRssi, formatTimestamp } from "@/services/scanHistory";
import { NetworkCard } from "@/components/NetworkCard";
import { WifiNetwork, rssiToLevel } from "@/hooks/useWifiScan";
import { SignalBars } from "@/components/SignalBars";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadHistory().then((sessions) => {
      const found = sessions.find((s) => s.id === id);
      setSession(found ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={colors.mutedForeground}
        />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Session not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { date, time } = formatTimestamp(session.timestamp);
  const avg = avgRssi(session.networks);
  const avgLevel = avg !== null ? rssiToLevel(avg) : null;

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
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={18} color={colors.primary} />
          <Text style={[styles.backLabel, { color: colors.primary }]}>History</Text>
        </TouchableOpacity>

        <Text style={[styles.headerDate, { color: colors.foreground }]}>
          {date}
        </Text>
        <Text style={[styles.headerTime, { color: colors.mutedForeground }]}>
          {time}
        </Text>

        <View style={styles.summaryRow}>
          <SummaryChip
            icon="access-point"
            label={`${session.networks.length} network${session.networks.length !== 1 ? "s" : ""}`}
            colors={colors}
          />
          {avg !== null && avgLevel !== null && (
            <View style={[styles.chip, { backgroundColor: colors.muted, borderRadius: 8 }]}>
              <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>
                avg signal
              </Text>
              <Text style={[styles.chipValue, { color: colors.foreground }]}>
                {avg} dBm
              </Text>
              <SignalBars level={avgLevel} size="sm" />
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={session.networks}
        keyExtractor={(item: WifiNetwork) => item.id}
        renderItem={({ item }) => <NetworkCard network={item} />}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No networks in this session
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function SummaryChip({
  icon,
  label,
  colors,
}: {
  icon: any;
  label: string;
  colors: any;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.muted, borderRadius: 8 }]}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.mutedForeground} />
      <Text style={[styles.chipValue, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  backLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  headerDate: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  headerTime: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  chipValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: { flex: 1 },
  listContent: { paddingTop: 12 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  backBtn: { marginTop: 8 },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
