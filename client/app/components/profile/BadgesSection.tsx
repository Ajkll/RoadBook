import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserBadge } from '../../services/api/badge.api';

interface BadgesSectionProps {
  badges: UserBadge[];
  formatDate: (dateString: string) => string;
}

export default function BadgesSection({
  badges,
  formatDate
}: BadgesSectionProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Mes badges</Text>
      
      {!badges || badges.length === 0 ? (
        <Text style={styles.emptyMessage}>Vous n'avez pas encore obtenu de badges</Text>
      ) : (
        badges.map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <View style={styles.badgeIcon}>
              <Text style={styles.badgeEmoji}>{badge.imageUrl}</Text>
            </View>
            <View style={styles.badgeContent}>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              <Text style={styles.badgeDate}>Obtenu le {formatDate(badge.awardedAt)}</Text>
            </View>
          </View>
        ))
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
  badgeCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 30,
  },
  badgeContent: {
    flex: 1,
    marginLeft: 15,
  },
  badgeName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  badgeDate: {
    fontSize: 12,
    color: '#999',
  },
});