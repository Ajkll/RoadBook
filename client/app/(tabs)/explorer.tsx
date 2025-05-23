import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { collection, getDocs, orderBy, limit, query, where } from 'firebase/firestore';
import { db } from '../services/firebase/firebaseConfig';
import TrajetsCarousel from '../components/roadbook/TrajetsCarousel';
import QueryCarousel from '../components/roadbook/QueryCarousel';
import OfflineContent from '../components/ui/OfflineContent';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { useTheme } from '../constants/theme';
import { sessionApi } from '../services/api/session.api';
import secureStorage from '../services/secureStorage';
import { useNotifications } from '../components/NotificationHandler';

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
  notes?: string;
}

type TabType = 'recent' | 'query';

export default function Explorer() {
  const [sessions, setSessions] = useState<DriveSession[]>([]);
  const [querySessions, setQuerySessions] = useState<DriveSession[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('recent');

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const isConnected = useSelector(selectIsInternetReachable);
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { showInfo, showError } = useNotifications();

  const [appliedFilters, setAppliedFilters] = useState({
    country: '',
    vehicle: '',
    minDistance: 0,
    maxDistance: 500,
    minDuration: 0,
    maxDuration: 300,
    limit: 10,
  });
  const applyFilters = useCallback((sessions, filters) => {
    let filtered = [...sessions];

    // Filtre par pays/lieu
    if (filters.country) {
      filtered = filtered.filter(session =>
        session.description?.toLowerCase().includes(filters.country.toLowerCase()) ||
        session.nom?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Filtre par véhicule
    if (filters.vehicle) {
      filtered = filtered.filter(session =>
        session.vehicle?.toLowerCase().includes(filters.vehicle.toLowerCase())
      );
    }

    // Filtre par distance
    filtered = filtered.filter(session => {
      const distance = session.roadInfo?.summary?.totalDistanceKm || 0;
      return distance >= filters.minDistance && distance <= filters.maxDistance;
    });

    // Filtre par durée
    filtered = filtered.filter(session => {
      const duration = session.elapsedTime || 0;
      const durationInMinutes = Math.round(duration / 60);
      return durationInMinutes >= filters.minDuration && durationInMinutes <= filters.maxDuration;
    });

    // Limiter le nombre de résultats
    return filtered.slice(0, filters.limit);
  }, []);

  // 3. Calculer les sessions filtrées
  const filteredSessions = useMemo(() => {
    return applyFilters(sessions, appliedFilters);
  }, [sessions, appliedFilters, applyFilters]);

  // 4. Fonction pour gérer les changements de filtres
  const handleFiltersChange = useCallback((newFilters) => {
    setAppliedFilters(newFilters);
  }, []);
  const handleSaveNotes = async (sessionId: string, notes: string) => {
    try {
      await sessionApi.updateSession(sessionId, { notes });
      setSessions(prev => prev.map(session =>
        session.id === sessionId ? { ...session, notes } : session
      ));
      showInfo('Note sauvegardée', "Vos notes ont été mises à jour avec succès.");
    } catch (error) {
      console.error('Error saving notes:', error);
      showError('Erreur', "Impossible de sauvegarder les notes.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionApi.deleteSession(sessionId);
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      showInfo('Vos données ont été supprimées', " Ce changement est iréversible. ", {
        position: 'center',
      });
    }
  };

  const fetchSessions = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const dbSessions = await sessionApi.getUserSessions();

      if (dbSessions.length === 0) {
        setSessions([]);
        setHasAttemptedFetch(true);
        return;
      }

      const { user } = await secureStorage.getAuthData();
      const userId = user?.id;
      const combinedSessions: DriveSession[] = [];

      for (const dbSession of dbSessions.slice(0, 20)) {//20 comme dans les filtres
        try {
          const q = query(
            collection(db, 'driveSessionsGPS'),
            where('sessionId', '==', dbSession.id),
            where('userId', '==', userId),
            limit(1)
          );

          const snapshot = await getDocs(q);
          let firebaseData = null;
          if (!snapshot.empty) {
            firebaseData = snapshot.docs[0].data();
          }

          const combinedSession: DriveSession = {
            id: dbSession.id,
            nom: dbSession.title || `Trajet du ${new Date(dbSession.date).toLocaleDateString()}`,
            description: dbSession.description || '',
            path: firebaseData?.path || [],
            createdAt: { seconds: new Date(dbSession.date).getTime() / 1000 },
            vehicle: firebaseData?.vehicle || 'Inconnu',
            weather: firebaseData?.weather || 'Non disponible',
            elapsedTime: Math.round(dbSession.duration * 60),
            roadInfo: {
              summary: {
                totalDistanceKm: dbSession.distance,
                totalDurationMinutes: dbSession.duration,
                trafficDelayMinutes: 0
              },
              speed: {
                average: dbSession.distance > 0 ? (dbSession.distance / (dbSession.duration / 60)) : 0
              }
            },
            notes: dbSession.notes
          };

          combinedSessions.push(combinedSession);
        } catch (error) {
          console.error(`Error fetching Firebase data for session ${dbSession.id}:`, error);

          const fallbackSession: DriveSession = {
            id: dbSession.id,
            nom: dbSession.title || `Trajet du ${new Date(dbSession.date).toLocaleDateString()}`,
            description: dbSession.description || '',
            path: [],
            createdAt: { seconds: new Date(dbSession.date).getTime() / 1000 },
            vehicle: 'Inconnu',
            weather: 'Non disponible',
            elapsedTime: Math.round(dbSession.duration * 60),
            roadInfo: {
              summary: {
                totalDistanceKm: dbSession.distance,
                totalDurationMinutes: dbSession.duration,
                trafficDelayMinutes: 0
              },
              speed: {
                average: dbSession.distance > 0 ? (dbSession.distance / (dbSession.duration / 60)) : 0
              }
            },
            notes: dbSession.notes
          };

          combinedSessions.push(fallbackSession);
        }
      }

      setSessions(combinedSessions);
      setHasAttemptedFetch(true);
    } catch (error) {
      console.error('Error fetching sessions:', error);
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

  const switchTab = (tab: TabType) => {
    if (tab === activeTab) return;

    setActiveTab(tab);
    Animated.timing(tabAnimation, {
      toValue: tab === 'recent' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSwipeGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.translationX > 50 && activeTab === 'query') {
      switchTab('recent');
    } else if (nativeEvent.translationX < -50 && activeTab === 'recent') {
      switchTab('query');
    }
  };

  const handleScrollIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

  const handleQueryResults = (results: DriveSession[]) => {
    setQuerySessions(results);
  };

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '100%'],
    extrapolate: 'clamp',
  });

  const contentTranslateX = tabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
    extrapolate: 'clamp',
  });

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'recent' && styles.tabButtonActive]}
        onPress={() => switchTab('recent')}
      >
        <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
          Trajets Récents
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'query' && styles.tabButtonActive]}
        onPress={() => switchTab('query')}
      >
        <Text style={[styles.tabText, activeTab === 'query' && styles.tabTextActive]}>
          Recherche
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentContent = () => {
    if (!hasAttemptedFetch) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (sessions.length > 0) {
      return (
        <>
          {/* Indicateur de filtres actifs */}
          {(appliedFilters.country || appliedFilters.vehicle ||
            appliedFilters.minDistance > 0 || appliedFilters.maxDistance < 500 ||
            appliedFilters.minDuration > 0 || appliedFilters.maxDuration < 300 ||
            appliedFilters.limit < 10) && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIndicatorText}>
                Filtres appliqués • {filteredSessions.length}/{sessions.length} trajets
              </Text>
            </View>
          )}

          <TrajetsCarousel
            trajets={filteredSessions}
            onScrollIndexChange={handleScrollIndexChange}
            onDeleteSession={handleDeleteSession}
            onSaveNotes={handleSaveNotes}
            onRefreshTrajets={fetchSessions}
          />
        </>
      );
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
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerContainer}>
        {renderTabHeader()}
        {activeTab === 'recent' && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBase} />
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
        )}
      </View>

      <PanGestureHandler
        onGestureEvent={handleSwipeGesture}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-10, 10]}
      >
        <Animated.View style={[styles.contentContainer, { transform: [{ translateX: contentTranslateX }] }]}>
          <View style={styles.pageContainer}>
            {renderRecentContent()}
          </View>

          <View style={styles.pageContainer}>
            <View style={styles.pageContainer}>
              <QueryCarousel onFiltersChange={handleFiltersChange} />
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      padding: theme.spacing.md,
      paddingBottom: 0,
    },
    filterIndicator: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      marginTop: 5,
      },
    filterIndicatorText: {
      color: theme.colors.ui.button.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    tabButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginRight: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: 'transparent',
    },
    tabButtonActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadow.sm,
    },
    tabText: {
      fontSize: theme.typography.body.fontSize,
      fontWeight: '500',
      color: theme.colors.backgroundText,
      textAlign: 'center',
    },
    tabTextActive: {
      color: theme.colors.ui.button.primaryText,
      fontWeight: '600',
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
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
      width: screenWidth * 2,
    },
    pageContainer: {
      width: screenWidth,
      flex: 1,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });