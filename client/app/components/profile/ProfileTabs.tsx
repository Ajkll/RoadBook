import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../../services/api/notification.api';
import { UserBadge } from '../../services/api/badge.api';

interface ProfileTabsProps {
  currentSection: string;
  setCurrentSection: (section: string) => void;
  notifications: Notification[];
  badges: UserBadge[];
}

export default function ProfileTabs({ 
  currentSection, 
  setCurrentSection,
  notifications,
  badges
}: ProfileTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, currentSection === 'profile' && styles.activeTab]} 
          onPress={() => setCurrentSection('profile')}
        >
          <Ionicons name="person-outline" size={18} color={currentSection === 'profile' ? "#7CA7D8" : "#666"} />
          <Text style={[styles.tabText, currentSection === 'profile' && styles.activeTabText]}>Profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentSection === 'security' && styles.activeTab]} 
          onPress={() => setCurrentSection('security')}
        >
          <Ionicons name="lock-closed-outline" size={18} color={currentSection === 'security' ? "#7CA7D8" : "#666"} />
          <Text style={[styles.tabText, currentSection === 'security' && styles.activeTabText]}>Sécurité</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentSection === 'notifications' && styles.activeTab]} 
          onPress={() => setCurrentSection('notifications')}
        >
          <Ionicons name="notifications-outline" size={18} color={currentSection === 'notifications' ? "#7CA7D8" : "#666"} />
          <Text style={[styles.tabText, currentSection === 'notifications' && styles.activeTabText]}>Notifications</Text>
          {notifications && Array.isArray(notifications) && notifications.filter(n => !n.isRead).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notifications.filter(n => !n.isRead).length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentSection === 'privacy' && styles.activeTab]} 
          onPress={() => setCurrentSection('privacy')}
        >
          <Ionicons name="shield-outline" size={18} color={currentSection === 'privacy' ? "#7CA7D8" : "#666"} />
          <Text style={[styles.tabText, currentSection === 'privacy' && styles.activeTabText]}>Confidentialité</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentSection === 'badges' && styles.activeTab]} 
          onPress={() => setCurrentSection('badges')}
        >
          <Ionicons name="ribbon-outline" size={18} color={currentSection === 'badges' ? "#7CA7D8" : "#666"} />
          <Text style={[styles.tabText, currentSection === 'badges' && styles.activeTabText]}>Badges</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{badges ? badges.length : 0}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabs: {
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7CA7D8',
  },
  tabText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  activeTabText: {
    color: '#7CA7D8',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeCount: {
    backgroundColor: '#7CA7D8',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
  },
  badgeCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});