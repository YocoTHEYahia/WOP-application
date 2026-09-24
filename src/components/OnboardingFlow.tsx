import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
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

const { width } = Dimensions.get("window");

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to WOP",
    body: "A calmer way to travel. Set a destination or distance — WOP watches quietly in the background and wakes you only when it matters.",
    icon: "⌂",
    primaryAction: { label: "Get Started", next: "trigger-mode" },
  },
  {
    id: "trigger-mode",
    title: "Choose Your Trigger",
    body: "Arrival: Alarm when you near a destination pin.\nDistance: Alarm after traveling a set distance from start.",
    icon: "⌖",
    primaryAction: { label: "Next", next: "permissions" },
  },
  {
    id: "permissions",
    title: "Location Permissions",
    body: "WOP needs your location to know when you arrive. We only track during active trips — never in the background without your consent.",
    icon: "📍",
    primaryAction: {
      label: "Grant Location",
      next: "background",
      action: "request-location",
    },
  },
  {
    id: "background",
    title: "Background Tracking",
    body: "For alarms to work with screen off, WOP needs background location permission. You'll be asked separately after starting your first trip.",
    icon: "🌙",
    primaryAction: { label: "I Understand", next: "battery" },
  },
  {
    id: "battery",
    title: "Battery Optimization",
    body: "Android may limit background apps. We'll guide you to exclude WOP from battery saver so alarms always fire.",
    icon: "🔋",
    primaryAction: { label: "Continue", next: "ready" },
  },
  {
    id: "ready",
    title: "You're All Set!",
    body: 'Tap "Start Trip" on the home screen, choose a destination or distance, and WOP will handle the rest.',
    icon: "✓",
    primaryAction: { label: "Start Using WOP", next: null, action: "finish" },
  },
];

type StepId = (typeof ONBOARDING_STEPS)[number]["id"];

interface Props {
  onComplete: () => void;
  onRequestLocation: () => Promise<boolean>;
}

export function OnboardingFlow({ onComplete, onRequestLocation }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [locationGranted, setLocationGranted] = useState(false);

  const step = ONBOARDING_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  if (!step) {
    return null;
  }

  const handlePrimaryPress = useCallback(async () => {
    if (step.primaryAction.action === "request-location") {
      const granted = await onRequestLocation();
      setLocationGranted(granted);
      if (granted) {
        setCurrentStepIndex((i) => i + 1);
      }
      return;
    }
    if (step.primaryAction.action === "finish") {
      onComplete();
      return;
    }
    if (step.primaryAction.next) {
      const nextIndex = ONBOARDING_STEPS.findIndex(
        (s) => s.id === step.primaryAction.next,
      );
      if (nextIndex >= 0) setCurrentStepIndex(nextIndex);
    }
  }, [step, onRequestLocation, onComplete]);

  const handleBackPress = useCallback(() => {
    if (currentStepIndex > 0) setCurrentStepIndex((i) => i - 1);
  }, [currentStepIndex]);

  const progress = (currentStepIndex + 1) / ONBOARDING_STEPS.length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { width: width - 40 }]}>
            <View
              style={[styles.progressFill, { width: (width - 40) * progress }]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          {step.id === "permissions" && !locationGranted && (
            <View style={styles.permissionsNote}>
              <Text style={styles.permissionsNoteText}>
                {
                  "You can also enable this later in Android Settings > Apps > WOP > Permissions"
                }
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonArea}>
          {!isLastStep && currentStepIndex > 0 && (
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
          <Pressable style={styles.primaryButton} onPress={handlePrimaryPress}>
            <Text style={styles.primaryButtonText}>
              {step.primaryAction.label}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  backButtonText: { color: palette.muted, fontSize: 15, fontWeight: "700" },
  body: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    textAlign: "center",
  },
  buttonArea: { gap: 12, paddingTop: 20 },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  content: { alignItems: "center", flex: 1, paddingTop: 20 },
  icon: { fontSize: 40 },
  iconCircle: {
    alignItems: "center",
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: "center",
    marginBottom: 30,
    width: 100,
  },
  permissionsNote: {
    backgroundColor: palette.panelStrong,
    borderColor: palette.line,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  permissionsNoteText: {
    color: palette.muted,
    fontSize: 12,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: palette.canvas,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  progressContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingTop: 20,
  },
  progressFill: {
    backgroundColor: palette.accent,
    borderRadius: 2,
    height: "100%",
  },
  progressText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  progressTrack: {
    backgroundColor: palette.panel,
    borderRadius: 2,
    height: 4,
    overflow: "hidden",
  },
  safe: { backgroundColor: palette.canvas, flex: 1 },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 16,
    textAlign: "center",
  },
});
