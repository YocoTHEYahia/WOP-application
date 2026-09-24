import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ScrollView,
  Alert,
} from "react-native";

const palette = {
  ink: "#F6F8FC",
  muted: "#97A4BB",
  canvas: "#0B1220",
  panel: "#121C2D",
  panelStrong: "#19263C",
  accent: "#70E1C1",
  accentDark: "#173E3A",
  warning: "#FFD166",
  danger: "#FF6B6B",
  line: "#26354C",
};

const OEM_GUIDES: Record<
  string,
  {
    label: string;
    packageName: string;
    settingsAction: string;
    deepLink?: string;
  }
> = {
  samsung: {
    label: "Samsung",
    packageName: "com.android.settings",
    settingsAction: "android.settings.APPLICATION_DETAILS_SETTINGS",
    deepLink: "package:com.wop.app",
  },
  xiaomi: {
    label: "Xiaomi / Redmi / POCO",
    packageName: "com.miui.securitycenter",
    settingsAction: "com.miui.powerkeeper.PowerKeeperActivity",
    deepLink: undefined,
  },
  oppo: {
    label: "OPPO / OnePlus / Realme",
    packageName: "com.coloros.phonemanager",
    settingsAction: "com.coloros.phonemanager.PowerUsageDetailActivity",
    deepLink: undefined,
  },
  vivo: {
    label: "vivo / iQOO",
    packageName: "com.vivo.abe",
    settingsAction: "com.vivo.abe.BackgroundAppManagerActivity",
    deepLink: undefined,
  },
  huawei: {
    label: "Huawei / Honor",
    packageName: "com.huawei.systemmanager",
    settingsAction: "com.huawei.systemmanager.optimize.process.ProtectActivity",
    deepLink: undefined,
  },
  motorola: {
    label: "Motorola",
    packageName: "com.android.settings",
    settingsAction: "android.settings.APPLICATION_DETAILS_SETTINGS",
    deepLink: "package:com.wop.app",
  },
  nokia: {
    label: "Nokia / HMD Global",
    packageName: "com.android.settings",
    settingsAction: "android.settings.APPLICATION_DETAILS_SETTINGS",
    deepLink: "package:com.wop.app",
  },
  sony: {
    label: "Sony",
    packageName: "com.android.settings",
    settingsAction: "android.settings.APPLICATION_DETAILS_SETTINGS",
    deepLink: "package:com.wop.app",
  },
  pixel: {
    label: "Google Pixel (stock Android)",
    packageName: "com.android.settings",
    settingsAction: "android.settings.APPLICATION_DETAILS_SETTINGS",
    deepLink: "package:com.wop.app",
  },
  generic: {
    label: "Other Android",
    packageName: "com.android.settings",
    settingsAction: "android.settings.APPLICATION_DETAILS_SETTINGS",
    deepLink: "package:com.wop.app",
  },
};

function detectOEM(): keyof typeof OEM_GUIDES {
  const constants = Platform.constants as any;
  const brand = (constants.Brand || constants.brand || "").toLowerCase();
  const manufacturer = (
    constants.Manufacturer ||
    constants.manufacturer ||
    ""
  ).toLowerCase();

  if (brand.includes("samsung") || manufacturer.includes("samsung"))
    return "samsung";
  if (
    brand.includes("xiaomi") ||
    manufacturer.includes("xiaomi") ||
    brand.includes("redmi") ||
    brand.includes("poco")
  )
    return "xiaomi";
  if (
    brand.includes("oppo") ||
    manufacturer.includes("oppo") ||
    brand.includes("oneplus") ||
    brand.includes("realme")
  )
    return "oppo";
  if (
    brand.includes("vivo") ||
    manufacturer.includes("vivo") ||
    brand.includes("iqoo")
  )
    return "vivo";
  if (
    brand.includes("huawei") ||
    manufacturer.includes("huawei") ||
    brand.includes("honor")
  )
    return "huawei";
  if (
    brand.includes("motorola") ||
    manufacturer.includes("motorola") ||
    brand.includes("lenovo")
  )
    return "motorola";
  if (
    brand.includes("nokia") ||
    manufacturer.includes("nokia") ||
    manufacturer.includes("hmd")
  )
    return "nokia";
  if (brand.includes("sony") || manufacturer.includes("sony")) return "sony";
  if (
    brand.includes("google") ||
    manufacturer.includes("google") ||
    brand.includes("pixel")
  )
    return "pixel";
  return "generic";
}

export function BatteryOptimizationGuide({
  onDismiss,
}: {
  onDismiss?: () => void;
}) {
  const oem = detectOEM();
  const guide = OEM_GUIDES[oem];

  if (!guide) {
    return null;
  }

  const openAppSettings = () => {
    if (guide.deepLink) {
      Linking.openSettings().catch(() => {
        Alert.alert(
          "Open Settings",
          `Please go to Settings > Apps > WOP > Battery and set to "Unrestricted" or "Allow background activity".`,
        );
      });
    } else {
      Alert.alert(
        `${guide.label} Battery Settings`,
        `On ${guide.label} devices, please:\n\n1. Open Settings > Battery > App battery usage\n2. Find WOP\n3. Set to "Unrestricted" or "Allow background activity"\n4. Also check: Settings > Apps > WOP > Battery > "Allow background activity"`,
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "OK" },
        ],
      );
    }
  };

  const openBatteryOptimization = () => {
    Linking.openURL("package:com.wop.app").catch(() => Linking.openSettings());
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🔋 Battery Optimization</Text>
        <Text style={styles.oemBadge}>{guide.label} detected</Text>
      </View>

      <Text style={styles.description}>
        Android manufacturers restrict background apps to save battery. For
        reliable alarms, WOP needs to run in the background. Please configure:
      </Text>

      <View style={styles.steps}>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Allow "Background location" when prompted
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            Remove WOP from battery optimization
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            Enable "Auto-start" / "Background activity" if available
          </Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={openAppSettings}>
        <Text style={styles.primaryButtonText}>Open App Settings</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={openBatteryOptimization}
      >
        <Text style={styles.secondaryButtonText}>
          Open Battery Optimization
        </Text>
      </Pressable>

      {onDismiss && (
        <Pressable style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>Dismiss for now</Text>
        </Pressable>
      )}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          ✓ WOP uses minimal battery — only GPS updates every 10s during active
          trips
        </Text>
        <Text style={styles.noteText}>
          ✓ No data leaves your device — everything stays local
        </Text>
        <Text style={styles.noteText}>
          ✓ Tested on Pixel, Samsung, Xiaomi, Motorola
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  description: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  dismissButton: { alignItems: "center", marginTop: 8 },
  dismissText: { color: palette.muted, fontSize: 13, fontWeight: "600" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  note: {
    borderTopColor: palette.line,
    borderTopWidth: 1,
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
  },
  noteText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  oemBadge: {
    backgroundColor: palette.accentDark,
    borderRadius: 8,
    color: palette.accent,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 14,
  },
  primaryButtonText: { color: palette.canvas, fontSize: 15, fontWeight: "800" },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.panelStrong,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    paddingVertical: 14,
  },
  secondaryButtonText: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  step: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  stepNumber: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    width: 24,
  },
  stepText: { color: palette.ink, flex: 1, fontSize: 14, lineHeight: 20 },
  steps: { gap: 10, marginBottom: 16 },
  title: { color: palette.ink, fontSize: 18, fontWeight: "800" },
});
