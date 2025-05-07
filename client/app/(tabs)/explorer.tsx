import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Animated,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../services/firebase/firebaseConfig';
import TrajetsCarousel from '../components/roadbook/TrajetsCarousel';
import OfflineContent from '../components/ui/OfflineContent';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { useTheme } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface DriveSession {
  id: string;
  nom: string;
  description: string;
  path: { latitude: number; longitude: number }[];
  createdAt: any;
  vehicle?: string;
  weather?: string;
  elapsedTime?: number;
  roadInfo?: any;
}

export default function Explorer() {
  const [sessions, setSessions] = useState<DriveSession[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const isConnected = useSelector(selectIsInternetReachable);
  const theme = useTheme();
  const styles = makeStyles(theme);

  const fetchSessions = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const q = query(collection(db, 'driveSessions'), orderBy('createdAt', 'desc'), limit(5));
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const snapshot = await getDocs(q);
      const result: DriveSession[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.path && data.path.length > 0) {
          result.push({
            id: doc.id,
            nom:
              data.nom ??
              `Trajet du ${new Date(data.createdAt?.seconds * 1000).toLocaleDateString()}`,
            path: data.path,
            createdAt: data.createdAt,
            vehicle: data.vehicle,
            weather: data.weather,
            elapsedTime: data.elapsedTime,
            roadInfo: data.roadInfo,
          });
        }
      });

      setSessions(result);
      setHasAttemptedFetch(true);
    } catch (error) {
      setHasAttemptedFetch(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchSessions();
    } else {
      setHasAttemptedFetch(true);
    }
  }, [fetchSessions, isConnected]);

  useEffect(() => {
    if (sessions.length === 0) return;

    const progressPercent = 0.2 + (currentIndex / (sessions.length - 1)) * 0.8;

    Animated.timing(progressAnimation, {
      toValue: progressPercent,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, sessions.length, progressAnimation]);

  const handleScrollIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '100%'],
    extrapolate: 'clamp',
  });

  const renderContent = () => {
    if (sessions.length > 0) {
      return <TrajetsCarousel trajets={sessions} onScrollIndexChange={handleScrollIndexChange} />;
    }

    if (!isConnected) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={fetchSessions}
              colors={[theme.colors.ui.button.primary]}
              tintColor={theme.colors.ui.button.primary}
            />
          }
        >
          <OfflineContent message="Impossible de charger les trajets. Vérifiez votre connexion internet." />
        </ScrollView>
      );
    }

    if (hasAttemptedFetch) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={fetchSessions}
              colors={[theme.colors.ui.button.primary]}
              tintColor={theme.colors.ui.button.primary}
            />
          }
        >
          <Text style={styles.emptyMessage}>Aucun trajet disponible</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchSessions}>
            <Text style={styles.refreshText}>Actualiser</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Trajets Récents</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBase} />
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </View>

      {renderContent()}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      marginBottom: theme.spacing.md,
    },
    header: {
      fontSize: theme.typography.header.fontSize,
      fontWeight: theme.typography.header.fontWeight,
      marginBottom: theme.spacing.sm,
      color: theme.colors.backgroundText,
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: theme.colors.ui.progressBar.background,
      borderRadius: theme.borderRadius.medium,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 0.7,
    },
    progressBarBase: {
      position: 'absolute',
      height: '100%',
      width: '20%',
      backgroundColor: theme.colors.ui.progressBar.fill,
      borderRadius: theme.borderRadius.medium,
    },
    progressBarFill: {
      position: 'absolute',
      height: '100%',
      backgroundColor: theme.colors.ui.progressBar.fill,
      borderRadius: theme.borderRadius.medium,
    },
    emptyMessage: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.backgroundTextSoft,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    refreshButton: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.ui.button.primary,
      borderRadius: theme.borderRadius.medium,
      ...theme.shadow.xl,
    },
    refreshText: {
      color: theme.colors.ui.button.primaryText,
      fontWeight: theme.typography.button.fontWeight,
      fontSize: theme.typography.button.fontSize,
      textTransform: theme.typography.button.textTransform,
    },
    offlineHint: {
      marginTop: theme.spacing.sm,
      color: theme.colors.backgroundTextSoft,
      fontStyle: 'italic',
      fontSize: theme.typography.caption.fontSize,
    },
  });

// to do : voir TrajetsCarousel.tsx
// to do : ajouter la possibilite d se balader sur la map un click prolonger devrais mettre celle ci en pleine ecrant ! et l'option itineraire diriger vers notre systeme de navigation !
