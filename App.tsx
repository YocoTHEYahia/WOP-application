import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { formatDistance } from './src/domain/geo';
import { DEFAULT_SETTINGS, WopSettings } from './src/domain/settings';
import { ActiveTrip, createTrip, Destination, reduceTrip, TriggerMode } from './src/domain/trip';
import { tripStore } from './src/storage/tripStore';

const palette = {
  ink: '#F6F8FC',
  muted: '#97A4BB',
  canvas: '#0B1220',
  panel: '#121C2D',
  panelStrong: '#19263C',
  accent: '#70E1C1',
  accentDark: '#173E3A',
  warning: '#FFD166',
  danger: '#FF6B6B',
  line: '#26354C',
};

type Screen = 'home' | 'destination' | 'history' | 'settings';

const initialRegion: Region = { latitude: 30.0444, longitude: 31.2357, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<TriggerMode>('arrival');
  const [radius, setRadius] = useState('250');
  const [distance, setDistance] = useState('5');
  const [destination, setDestination] = useState<Destination | undefined>();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [settings, setSettings] = useState<WopSettings>(DEFAULT_SETTINGS);
  const [permissionState, setPermissionState] = useState<'unknown' | 'ready' | 'denied'>('unknown');
  const [historyCount, setHistoryCount] = useState(0);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const alarmSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    void Promise.all([tripStore.getActiveTrip(), tripStore.getSettings(), tripStore.getHistory()]).then(([savedTrip, savedSettings, history]) => {
      setActiveTrip(savedTrip);
      setSettings(savedSettings);
      setHistoryCount(history.length);
    });
    void Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => () => {
    locationSubscription.current?.remove();
    void alarmSound.current?.unloadAsync();
  }, []);

  const requestLocation = async (): Promise<boolean> => {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      setPermissionState('denied');
      return false;
    }
    setPermissionState('ready');
    return true;
  };

  const selectDestination = (coordinate: { latitude: number; longitude: number }) => {
    setDestination({
      id: `destination_${Date.now()}`,
      label: 'Dropped pin',
      address: 'Map point selected',
      coordinate,
      createdAt: Date.now(),
    });
  };

  const startTrip = async () => {
    const hasPermission = await requestLocation();
    if (!hasPermission) {
      Alert.alert('Location is needed', 'WOP needs your location to know when you arrive. You can enable it in Android Settings.');
      return;
    }
    if (mode === 'arrival' && !destination) {
      setScreen('destination');
      return;
    }
    const config = {
      mode,
      destination,
      radiusMeters: Math.max(50, Number(radius) || 250),
      distanceMeters: Math.max(0.1, Number(distance) || 5) * 1000,
      soundEnabled: settings.soundEnabled,
      vibrationEnabled: settings.vibrationEnabled,
    };
    const trip = createTrip(config);
    setActiveTrip(trip);
    await tripStore.saveActiveTrip(trip);
    setScreen('home');
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: settings.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 10_000 },
      (location) => {
        setActiveTrip((current) => {
          if (!current) return current;
          const next = reduceTrip(current, {
            type: 'location',
            sample: { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracyMeters: location.coords.accuracy ?? undefined, timestamp: location.timestamp },
          });
          void tripStore.saveActiveTrip(next);
          if (next.status === 'alarming' && current.status !== 'alarming') void triggerAlarm(next);
          return next;
        });
      },
    );
  };

  const triggerAlarm = async (trip: ActiveTrip) => {
    if (trip.config.soundEnabled) {
      const sound = new Audio.Sound();
      try {
        await sound.loadAsync(require('./assets/alarm.wav'), { isLooping: true, shouldPlay: true, volume: 1 });
        alarmSound.current = sound;
      } catch {
        // The alarm screen remains usable even if audio cannot load.
      }
    }
    if (trip.config.vibrationEnabled) await Notifications.scheduleNotificationAsync({ content: { title: 'WOP alarm', body: 'You reached your destination.', sound: 'default' }, trigger: null });
  };

  const stopTrip = async () => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    await alarmSound.current?.stopAsync();
    await alarmSound.current?.unloadAsync();
    alarmSound.current = null;
    if (activeTrip) {
      const completed = reduceTrip(activeTrip, activeTrip.status === 'alarming' ? { type: 'alarm-stopped' } : { type: 'stop' });
      await tripStore.saveActiveTrip(null);
      const history = await tripStore.getHistory();
      await tripStore.saveHistory([{ ...completed, finishedAt: Date.now() }, ...history]);
      setHistoryCount(history.length + 1);
      setActiveTrip(null);
    }
  };

  const saveSettings = async (next: WopSettings) => {
    setSettings(next);
    await tripStore.saveSettings(next);
  };

  const statusText = activeTrip?.status === 'alarming' ? 'Alarm active' : activeTrip ? 'Trip tracking' : 'Ready for your next trip';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>WOP / DESTINATION ALARM</Text><Text style={styles.title}>Never miss your stop.</Text></View>
          <View style={styles.logo}><Text style={styles.logoText}>W</Text></View>
        </View>
        {activeTrip?.status === 'alarming' ? <AlarmCard onStop={stopTrip} /> : screen === 'home' ? <HomeScreen statusText={statusText} activeTrip={activeTrip} destination={destination} mode={mode} onMode={setMode} onStart={startTrip} onChooseDestination={() => setScreen('destination')} /> : screen === 'destination' ? <DestinationScreen destination={destination} onSelect={selectDestination} onBack={() => setScreen('home')} onUse={startTrip} /> : screen === 'history' ? <HistoryScreen count={historyCount} /> : <SettingsScreen settings={settings} onChange={saveSettings} />}
        <NavBar screen={screen} onNavigate={setScreen} activeTrip={Boolean(activeTrip)} />
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ statusText, activeTrip, destination, mode, onMode, onStart, onChooseDestination }: { statusText: string; activeTrip: ActiveTrip | null; destination?: Destination; mode: TriggerMode; onMode: (mode: TriggerMode) => void; onStart: () => void; onChooseDestination: () => void }) {
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><View style={styles.statusPill}><View style={[styles.dot, activeTrip && { backgroundColor: palette.warning }]} /><Text style={styles.statusText}>{statusText}</Text></View><Text style={styles.heroTitle}>A calmer way to travel.</Text><Text style={styles.heroBody}>Set a destination or distance. WOP watches quietly in the background and wakes you only when it matters.</Text></View>
    <Text style={styles.sectionLabel}>TRIP TRIGGER</Text>
    <View style={styles.segment}><Segment label="Arrive near" selected={mode === 'arrival'} onPress={() => onMode('arrival')} /><Segment label="Travel distance" selected={mode === 'distance'} onPress={() => onMode('distance')} /></View>
    {mode === 'arrival' ? <Pressable style={styles.destinationCard} onPress={onChooseDestination}><View style={styles.iconCircle}><Text style={styles.icon}>⌖</Text></View><View style={styles.flex}><Text style={styles.cardTitle}>{destination?.label ?? 'Choose a destination'}</Text><Text style={styles.cardSubtitle}>{destination?.address ?? 'Search or drop a pin on the map'}</Text></View><Text style={styles.chevron}>›</Text></Pressable> : <View style={styles.inputCard}><Text style={styles.cardTitle}>Wake me after</Text><View style={styles.inputRow}><TextInput style={styles.bigInput} keyboardType="decimal-pad" defaultValue="5" /><Text style={styles.unit}>km from start</Text></View></View>}
    <View style={styles.infoRow}><Text style={styles.infoIcon}>◷</Text><Text style={styles.infoText}>Your alarm will use a {mode === 'arrival' ? '250 m' : '5 km'} trigger by default. You can fine-tune it in Settings.</Text></View>
    <Pressable style={styles.primaryButton} onPress={onStart}><Text style={styles.primaryButtonText}>{activeTrip ? 'Trip already tracking' : 'Start trip'}</Text><Text style={styles.primaryButtonArrow}>→</Text></Pressable>
    <View style={styles.trustRow}><Text style={styles.trustText}>●  Foreground tracking</Text><Text style={styles.trustText}>●  Local-first</Text><Text style={styles.trustText}>●  No ads</Text></View>
  </ScrollView>;
}

function DestinationScreen({ destination, onSelect, onBack, onUse }: { destination?: Destination; onSelect: (coordinate: { latitude: number; longitude: number }) => void; onBack: () => void; onUse: () => void }) {
  const [region, setRegion] = useState(initialRegion);
  return <View style={styles.flex}><View style={styles.mapHeader}><Pressable onPress={onBack}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.mapTitle}>Choose destination</Text><View style={{ width: 30 }} /></View><View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.searchInput} placeholder="Search an address or place" placeholderTextColor={palette.muted} /></View><MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={region} onRegionChangeComplete={setRegion} onPress={(event) => onSelect(event.nativeEvent.coordinate)}><Marker coordinate={destination?.coordinate ?? { latitude: region.latitude, longitude: region.longitude }} /></MapView><View style={styles.mapBottom}><Text style={styles.mapHint}>Tap anywhere on the map to drop a pin.</Text><Pressable style={[styles.primaryButton, !destination && styles.disabledButton]} disabled={!destination} onPress={onUse}><Text style={styles.primaryButtonText}>Use this destination</Text><Text style={styles.primaryButtonArrow}>→</Text></Pressable></View></View>;
}

function HistoryScreen({ count }: { count: number }) { return <ScrollView contentContainerStyle={styles.content}><Text style={styles.pageTitle}>Your trips</Text><Text style={styles.pageSubtitle}>{count ? `${count} saved trip${count === 1 ? '' : 's'}` : 'Your recent trips will appear here.'}</Text>{count === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>◌</Text><Text style={styles.cardTitle}>No trips yet</Text><Text style={styles.cardSubtitle}>Start a trip and WOP will keep a private local history for quick reference.</Text></View> : <View style={styles.empty}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.cardTitle}>History is ready</Text><Text style={styles.cardSubtitle}>Trip details are stored locally on your device.</Text></View>}</ScrollView>; }

function SettingsScreen({ settings, onChange }: { settings: WopSettings; onChange: (settings: WopSettings) => void }) { return <ScrollView contentContainerStyle={styles.content}><Text style={styles.pageTitle}>Settings</Text><Text style={styles.pageSubtitle}>Make WOP feel right for every journey.</Text><Text style={styles.sectionLabel}>DEFAULTS</Text><SettingRow label="Sound" description="Play a looping alarm" value={settings.soundEnabled} onChange={(soundEnabled) => onChange({ ...settings, soundEnabled })} /><SettingRow label="Vibration" description="Vibrate with the alarm" value={settings.vibrationEnabled} onChange={(vibrationEnabled) => onChange({ ...settings, vibrationEnabled })} /><SettingRow label="High accuracy" description="Uses more battery, improves arrival precision" value={settings.highAccuracy} onChange={(highAccuracy) => onChange({ ...settings, highAccuracy })} /><Text style={styles.sectionLabel}>UNITS</Text><View style={styles.segment}><Segment label="Kilometers" selected={settings.unit === 'km'} onPress={() => onChange({ ...settings, unit: 'km' })} /><Segment label="Miles" selected={settings.unit === 'mi'} onPress={() => onChange({ ...settings, unit: 'mi' })} /></View><View style={styles.batteryCard}><Text style={styles.batteryTitle}>Battery guidance</Text><Text style={styles.cardSubtitle}>For reliable alarms, allow background location and remove WOP from battery optimization. Android manufacturers may still limit background work.</Text></View></ScrollView>; }

function SettingRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={styles.settingRow}><View style={styles.flex}><Text style={styles.cardTitle}>{label}</Text><Text style={styles.cardSubtitle}>{description}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: palette.line, true: palette.accentDark }} thumbColor={value ? palette.accent : '#CCD3DF'} /></View>; }
function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable style={[styles.segmentItem, selected && styles.segmentItemSelected]} onPress={onPress}><Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text></Pressable>; }
function AlarmCard({ onStop }: { onStop: () => void }) { return <View style={styles.alarm}><View style={styles.alarmPulse}><Text style={styles.alarmIcon}>!</Text></View><Text style={styles.alarmTitle}>You’re there.</Text><Text style={styles.alarmBody}>WOP detected that you reached your trigger point.</Text><Pressable style={styles.stopButton} onPress={onStop}><Text style={styles.stopButtonText}>I’m awake · Stop alarm</Text></Pressable></View>; }
function NavBar({ screen, onNavigate, activeTrip }: { screen: Screen; onNavigate: (screen: Screen) => void; activeTrip: boolean }) { return <View style={styles.nav}>{[['home', '⌂', 'Home'], ['destination', '⌖', 'Map'], ['history', '◷', 'Trips'], ['settings', '⚙', 'Settings']].map(([id, icon, label]) => <Pressable key={id} onPress={() => onNavigate(id as Screen)} style={styles.navItem}><Text style={[styles.navIcon, screen === id && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, screen === id && styles.navActive]}>{activeTrip && id === 'home' ? 'Tracking' : label}</Text></Pressable>)}</View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.canvas }, shell: { flex: 1, paddingHorizontal: 20 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 14 }, eyebrow: { color: palette.accent, fontSize: 10, letterSpacing: 1.7, fontWeight: '800' }, title: { color: palette.ink, fontSize: 23, fontWeight: '800', marginTop: 4 }, logo: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accent }, logoText: { color: palette.canvas, fontWeight: '900', fontSize: 22 }, content: { paddingTop: 8, paddingBottom: 110 }, hero: { paddingVertical: 20 }, statusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: palette.panel, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 22 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent, marginRight: 8 }, statusText: { color: palette.muted, fontSize: 12, fontWeight: '700' }, heroTitle: { color: palette.ink, fontSize: 34, lineHeight: 39, fontWeight: '800', maxWidth: 300 }, heroBody: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 340 }, sectionLabel: { color: palette.muted, fontSize: 10, letterSpacing: 1.8, fontWeight: '800', marginTop: 12, marginBottom: 10 }, segment: { flexDirection: 'row', backgroundColor: palette.panel, borderRadius: 14, padding: 4, marginBottom: 14 }, segmentItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 }, segmentItemSelected: { backgroundColor: palette.panelStrong }, segmentText: { color: palette.muted, fontSize: 13, fontWeight: '700' }, segmentTextSelected: { color: palette.ink }, destinationCard: { backgroundColor: palette.panel, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.line }, iconCircle: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.accentDark, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, icon: { color: palette.accent, fontSize: 22 }, flex: { flex: 1 }, cardTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' }, cardSubtitle: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }, chevron: { color: palette.accent, fontSize: 30, fontWeight: '300' }, inputCard: { backgroundColor: palette.panel, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: palette.line }, inputRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }, bigInput: { color: palette.ink, fontSize: 38, fontWeight: '800', minWidth: 100, padding: 0 }, unit: { color: palette.muted, fontSize: 14 }, infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 3 }, infoIcon: { color: palette.warning, fontSize: 20, marginRight: 10 }, infoText: { color: palette.muted, lineHeight: 18, fontSize: 12, flex: 1 }, primaryButton: { backgroundColor: palette.accent, minHeight: 58, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 19, marginTop: 4 }, primaryButtonText: { color: palette.canvas, fontSize: 16, fontWeight: '900' }, primaryButtonArrow: { color: palette.canvas, fontSize: 24 }, disabledButton: { opacity: 0.4 }, trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, trustText: { color: palette.muted, fontSize: 10, fontWeight: '700' }, nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, paddingBottom: 8, backgroundColor: palette.canvas, borderTopWidth: 1, borderTopColor: palette.line, flexDirection: 'row', justifyContent: 'space-around' }, navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 64 }, navIcon: { color: palette.muted, fontSize: 21, marginBottom: 2 }, navLabel: { color: palette.muted, fontSize: 10, fontWeight: '700' }, navActive: { color: palette.accent }, pageTitle: { color: palette.ink, fontSize: 30, fontWeight: '800', marginTop: 24 }, pageSubtitle: { color: palette.muted, fontSize: 15, marginTop: 8, marginBottom: 24 }, empty: { alignItems: 'center', backgroundColor: palette.panel, borderRadius: 20, padding: 28, marginTop: 30 }, emptyIcon: { color: palette.accent, fontSize: 44, marginBottom: 12 }, settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.line }, batteryCard: { backgroundColor: palette.panel, borderRadius: 18, padding: 18, marginTop: 26 }, batteryTitle: { color: palette.warning, fontWeight: '800', fontSize: 15, marginBottom: 8 }, mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }, back: { color: palette.accent, fontSize: 36, lineHeight: 36 }, mapTitle: { color: palette.ink, fontSize: 17, fontWeight: '800' }, searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.panel, borderRadius: 15, paddingHorizontal: 14, marginVertical: 10 }, searchIcon: { color: palette.accent, fontSize: 22, marginRight: 8 }, searchInput: { flex: 1, color: palette.ink, height: 48, fontSize: 14 }, map: { flex: 1, borderRadius: 18, overflow: 'hidden' }, mapBottom: { paddingTop: 12, paddingBottom: 84 }, mapHint: { color: palette.muted, textAlign: 'center', fontSize: 12, marginBottom: 10 }, alarm: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }, alarmPulse: { width: 106, height: 106, borderRadius: 53, backgroundColor: palette.danger, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }, alarmIcon: { color: '#fff', fontSize: 58, fontWeight: '900' }, alarmTitle: { color: palette.ink, fontSize: 36, fontWeight: '900' }, alarmBody: { color: palette.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, marginBottom: 32 }, stopButton: { width: '100%', backgroundColor: palette.ink, paddingVertical: 18, borderRadius: 16, alignItems: 'center' }, stopButtonText: { color: palette.canvas, fontSize: 16, fontWeight: '900' },
});
