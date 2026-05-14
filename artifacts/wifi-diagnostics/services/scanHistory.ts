import AsyncStorage from "@react-native-async-storage/async-storage";
import { WifiNetwork } from "@/hooks/useWifiScan";

const STORAGE_KEY = "@wifi_diagnostics/scan_history";
const MAX_SESSIONS = 15;

export interface ScanSession {
  id: string;
  timestamp: string;
  networks: WifiNetwork[];
}

export async function loadHistory(): Promise<ScanSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanSession[];
  } catch {
    return [];
  }
}

export async function saveSession(networks: WifiNetwork[]): Promise<ScanSession> {
  const session: ScanSession = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    networks,
  };

  try {
    const existing = await loadHistory();
    const updated = [session, ...existing].slice(0, MAX_SESSIONS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
  }

  return session;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function avgRssi(networks: WifiNetwork[]): number | null {
  if (networks.length === 0) return null;
  return Math.round(networks.reduce((sum, n) => sum + n.level, 0) / networks.length);
}

export function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { date, time };
}
