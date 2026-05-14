import { useState, useCallback } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { saveSession } from "@/services/scanHistory";

export interface WifiNetwork {
  id: string;
  SSID: string;
  BSSID: string;
  level: number;
  frequency: number;
  capabilities: string;
}

export type ScanStatus = "idle" | "requesting" | "scanning" | "done" | "error" | "unavailable";

export type SignalLevel = "excellent" | "good" | "fair" | "weak" | "poor";

export function rssiToLevel(rssi: number): SignalLevel {
  if (rssi >= -50) return "excellent";
  if (rssi >= -60) return "good";
  if (rssi >= -70) return "fair";
  if (rssi >= -80) return "weak";
  return "poor";
}

export function rssiToPercent(rssi: number): number {
  const clamped = Math.max(-100, Math.min(-30, rssi));
  return Math.round(((clamped + 100) / 70) * 100);
}

export function frequencyToBand(freq: number): string {
  if (freq >= 6000) return "6 GHz";
  if (freq >= 5000) return "5 GHz";
  if (freq >= 2400) return "2.4 GHz";
  if (freq === 0) return "Unknown";
  return `${freq} MHz`;
}

export function parseSecurityType(capabilities: string): string {
  if (!capabilities) return "Open";
  if (capabilities.includes("WPA3")) return "WPA3";
  if (capabilities.includes("WPA2")) return "WPA2";
  if (capabilities.includes("WPA")) return "WPA";
  if (capabilities.includes("WEP")) return "WEP";
  return "Open";
}

async function requestAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return false;

  const permissions: string[] = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];

  const sdkInt = parseInt(String(Platform.Version), 10);
  if (sdkInt >= 33) {
    permissions.push("android.permission.NEARBY_WIFI_DEVICES");
  }

  const results = await PermissionsAndroid.requestMultiple(
    permissions as Parameters<typeof PermissionsAndroid.requestMultiple>[0]
  );

  return Object.values(results).every(
    (r) => r === PermissionsAndroid.RESULTS.GRANTED
  );
}

export function useWifiScan() {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const scan = useCallback(async () => {
    try {
      setStatus("requesting");
      setErrorMessage("");

      if (Platform.OS === "web") {
        setStatus("unavailable");
        setErrorMessage("Wi-Fi scanning is not available on web.");
        return;
      }

      const granted = await requestAndroidPermissions();
      if (!granted) {
        setStatus("error");
        setErrorMessage(
          "Location permission is required to scan Wi-Fi networks. Please grant it in Settings."
        );
        return;
      }

      setStatus("scanning");

      let WifiManager: any;
      try {
        WifiManager = require("react-native-wifi-reborn").default;
      } catch {
        setStatus("unavailable");
        setErrorMessage(
          "Wi-Fi scanning requires a native build. Build with EAS to enable real scanning."
        );
        return;
      }

      const rawList = await WifiManager.reScanAndLoadWifiList();

      const parsed: WifiNetwork[] = (rawList as any[]).map((item: any, idx: number) => ({
        id: `${item.BSSID ?? idx}-${idx}`,
        SSID: item.SSID || "(Hidden Network)",
        BSSID: item.BSSID || "Unknown",
        level: item.level ?? -100,
        frequency: item.frequency ?? 0,
        capabilities: item.capabilities || "",
      }));

      const sorted = parsed.sort((a, b) => b.level - a.level);
      setNetworks(sorted);

      const now = new Date();
      setLastScanTime(now);
      setStatus("done");

      await saveSession(sorted);
    } catch (err: any) {
      if (
        err?.message?.includes("throttled") ||
        err?.message?.includes("rate limit")
      ) {
        setStatus("error");
        setErrorMessage(
          "Android is throttling scan requests. Please wait 30 seconds between scans."
        );
      } else {
        setStatus("error");
        setErrorMessage(err?.message || "An unexpected error occurred.");
      }
    }
  }, []);

  return { networks, status, errorMessage, lastScanTime, scan };
}
