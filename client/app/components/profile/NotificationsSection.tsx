import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../../services/api/notification.api';

interface NotificationsSectionProps {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  formatDate: (dateString: string) => string;
}

export default function NotificationsSection({
  notifications,
  setNotifications,
  formatDate
}: NotificationsSectionProps) {
  // Vérifier et s'assurer que notifications est un tableau
  const notificationsList = Array.isArray(notifications) ? notifications : [];
  
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Mes notifications</Text>
      
      {notificationsList.length === 0 ? (
        <Text style={styles.emptyMessage}>Vous n'avez pas de notifications</Text>
      ) : (
        notificationsList.map((notification) => (
          <View key={notification.id} style={[styles.notificationCard, notification.isRead ? styles.notificationRead : styles.notificationUnread]}>
            <View style={styles.notificationDot}>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationAction}
              onPress={() => {
                // Marquer comme lu
                setNotifications(notificationsList.map(n => 
                  n.id === notification.id ? {...n, isRead: true} : n
                ));
              }}
            >
              <Ionicons name={notification.isRead ? "checkmark-done-outline" : "checkmark-outline"} size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
        ))
      )}
      
      {notificationsList.length > 0 && (
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={() => {
            setNotifications([]);
            Alert.alert('Succès', 'Toutes les notifications ont été supprimées');
          }}
        >
          <Text style={styles.buttonText}>Supprimer toutes les notifications</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  notificationUnread: {
    backgroundColor: '#f0f7ff',
  },
  notificationRead: {
    backgroundColor: '#fff',
  },
  notificationDot: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7CA7D8',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 10,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  notificationAction: {
    padding: 5,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
});