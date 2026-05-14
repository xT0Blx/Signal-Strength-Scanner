import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  ScanSession,
  loadHistory,
  clearHistory,
  avgRssi,
  formatTimestamp,
} from "@/services/scanHistory";
import { rssiToLevel } from "@/hooks/useWifiScan";
import { SignalBars } from "@/components/SignalBars";
import { useState } from "react";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sessions, setSessions] = useState<ScanSession[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setSessions);
    }, [])
  );

  const handleClear = () => {
    Alert.alert(
      "Clear History",
      "Delete all saved scan sessions? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            setSessions([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleTap = (session: ScanSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/session/[id]", params: { id: session.id } });
  };

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
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Feather name="clock" size={20} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Scan History
            </Text>
          </View>
          {sessions.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="trash-2" size={18} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {sessions.length === 0
            ? "No scans saved yet"
            : `${sessions.length} of 15 session${sessions.length !== 1 ? "s" : ""} stored`}
        </Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SessionRow
            session={item}
            index={index}
            colors={colors}
            onTap={handleTap}
          />
        )}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad + 80, flexGrow: 1 },
        ]}
        ListEmptyComponent={<HistoryEmpty colors={colors} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function SessionRow({
  session,
  index,
  colors,
  onTap,
}: {
  session: ScanSession;
  index: number;
  colors: any;
  onTap: (s: ScanSession) => void;
}) {
  const { date, time } = formatTimestamp(session.timestamp);
  const avg = avgRssi(session.networks);
  const avgLevel = avg !== null ? rssiToLevel(avg) : null;

  return (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
      onPress={() => onTap(session)}
      activeOpacity={0.75}
    >
      <View style={styles.sessionLeft}>
        <View style={styles.sessionIndex}>
          <Text style={[styles.sessionIndexText, { color: colors.mutedForeground }]}>
            #{index + 1}
          </Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionDate, { color: colors.foreground }]}>
            {date}
          </Text>
          <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
            {time}
          </Text>
        </View>
      </View>

      <View style={styles.sessionRight}>
        <View style={styles.sessionStats}>
          <View style={styles.networkCountRow}>
            <MaterialCommunityIcons
              name="access-point"
              size={14}
              color={colors.mutedForeground}
            />
            <Text style={[styles.networkCount, { color: colors.foreground }]}>
              {session.networks.length}
            </Text>
          </View>
          {avg !== null && avgLevel !== null && (
            <View style={styles.avgRow}>
              <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>
                avg
              </Text>
              <Text style={[styles.avgValue, { color: colors.subtext }]}>
                {avg} dBm
              </Text>
              <SignalBars level={avgLevel} size="sm" />
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function HistoryEmpty({ colors }: { colors: any }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="history"
        size={52}
        color={colors.mutedForeground}
        style={{ opacity: 0.35 }}
      />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No History Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Completed scans are saved here{"\n"}automatically for comparison
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  list: { flex: 1 },
  listContent: { paddingTop: 12, paddingHorizontal: 16 },
  sessionCard: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sessionIndex: {
    width: 28,
    alignItems: "center",
  },
  sessionIndexText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sessionTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sessionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sessionStats: {
    alignItems: "flex-end",
    gap: 4,
  },
  networkCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  networkCount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  avgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  avgLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  avgValue: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
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
});
