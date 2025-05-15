import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../utils/logger';

/**
 * Écran de gestion des sessions utilisateur
 * Affiche toutes les sessions actives et permet de les révoquer
 */
export default function SessionsScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Récupérer les sessions au chargement
  useEffect(() => {
    fetchSessions();
  }, []);

  /**
   * Récupère les sessions utilisateur depuis l'API
   */
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      
      // Simuler un appel API avec des données fictives
      setTimeout(() => {
        // Données de test
        const mockSessions = [
          {
            id: '1',
            deviceName: 'iPhone 13',
            platform: 'iOS',
            ipAddress: '192.168.1.105',
            location: 'Bruxelles, Belgium',
            lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
            isCurrentDevice: true,
          },
          {
            id: '2',
            deviceName: 'Chrome on Windows',
            platform: 'Windows',
            ipAddress: '192.168.1.56',
            location: 'Liège, Belgium',
            lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            isCurrentDevice: false,
          },
          {
            id: '3',
            deviceName: 'Safari on MacBook',
            platform: 'macOS',
            ipAddress: '192.168.0.12',
            location: 'Antwerp, Belgium',
            lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            isCurrentDevice: false,
          },
        ];
        
        setSessions(mockSessions);
        setIsLoading(false);
        setRefreshing(false);
      }, 1000);
      
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions', error);
      Alert.alert(
        'Erreur',
        'Impossible de récupérer les sessions. Veuillez réessayer plus tard.'
      );
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Rafraîchit la liste des sessions
   */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  /**
   * Formate la date de dernière activité
   */
  const formatLastActive = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSec < 60) {
      return 'à l\'instant';
    } else if (diffMin < 60) {
      return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  /**
   * Révoque une session utilisateur
   */
  const handleRevokeSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    
    if (session?.isCurrentDevice) {
      Alert.alert(
        'Session actuelle',
        'Vous ne pouvez pas révoquer votre session actuelle. Utilisez la fonction de déconnexion à la place.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Révoquer la session',
      'Êtes-vous sûr de vouloir révoquer cette session ? L\'utilisateur sera déconnecté de cet appareil.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: () => {
            // Simulation de révocation
            setSessions(sessions.filter(s => s.id !== sessionId));
            Alert.alert('Session révoquée', 'La session a été révoquée avec succès.');
          },
        },
      ]
    );
  };

  /**
   * Révoque toutes les autres sessions
   */
  const handleRevokeAllOtherSessions = () => {
    Alert.alert(
      'Révoquer toutes les autres sessions',
      'Êtes-vous sûr de vouloir révoquer toutes les autres sessions ? Tous les autres appareils seront déconnectés.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Révoquer tout',
          style: 'destructive',
          onPress: () => {
            // Conserver uniquement la session actuelle
            setSessions(sessions.filter(s => s.isCurrentDevice));
            Alert.alert('Sessions révoquées', 'Toutes les autres sessions ont été révoquées avec succès.');
          },
        },
      ]
    );
  };

  /**
   * Rendu d'un élément de session
   */
  const renderSession = ({ item }) => (
    <View 
      style={[
        styles.sessionCard, 
        { 
          backgroundColor: colors.card,
          borderColor: item.isCurrentDevice ? colors.primary : colors.border, 
          borderWidth: item.isCurrentDevice ? 1.5 : 1
        }
      ]}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.deviceInfo}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={
                item.platform === 'iOS' || item.platform === 'Android' 
                  ? 'phone-portrait-outline' 
                  : 'laptop-outline'
              } 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <View>
            <Text style={[styles.deviceName, { color: colors.text }]}>{item.deviceName}</Text>
            <Text style={[styles.sessionInfo, { color: colors.secondaryText }]}>
              {item.location} • {item.ipAddress}
            </Text>
            <Text style={[styles.lastActive, { color: colors.secondaryText }]}>
              Actif {formatLastActive(item.lastActive)}
            </Text>
          </View>
        </View>
        
        {item.isCurrentDevice && (
          <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.currentText}>Actuel</Text>
          </View>
        )}
      </View>

      {!item.isCurrentDevice && (
        <TouchableOpacity 
          style={styles.revokeButton} 
          onPress={() => handleRevokeSession(item.id)}
        >
          <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
          <Text style={styles.revokeText}>Révoquer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerInfo}>
        <Text style={[styles.infoText, { color: colors.secondaryText }]}>
          Voici la liste de tous les appareils où vous êtes actuellement connecté. Vous pouvez révoquer l'accès pour tout appareil suspect.
        </Text>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Aucune autre session active
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
              Vous n'êtes connecté que sur cet appareil
            </Text>
          </View>
        }
      />

      {sessions.filter(s => !s.isCurrentDevice).length > 0 && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.revokeAllButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} 
            onPress={handleRevokeAllOtherSessions}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.revokeAllText}>Révoquer toutes les autres sessions</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  sessionCard: {
    borderRadius: 10,
    marginVertical: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionInfo: {
    fontSize: 13,
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 13,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  currentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  revokeText: {
    marginLeft: 6,
    color: '#ef4444',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  revokeAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  revokeAllText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
  },
});