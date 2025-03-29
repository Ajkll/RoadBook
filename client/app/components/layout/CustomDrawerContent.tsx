// app/components/layout/CustomDrawerContent.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../constants/theme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomDrawerContent = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  

  // Helper to check active route
  const isActive = (path) => pathname === path;

  // Group drawer items for better organization
  const mainItems = [
    { name: 'Dashboard', icon: 'grid-outline', route: '/DashboardScreen' },
    { name: 'My Roadbook', icon: 'book-outline', route: '/MyRoadbookScreen' },
    { name: 'My Routes', icon: 'map-outline', route: '/MyRoutesScreen' },
  ];

  const communityItems = [
    { name: 'Community', icon: 'people-outline', route: '/CommunityScreen' },
    { name: 'Mentors', icon: 'person-add-outline', route: '/MentorsScreen' },
    { name: 'Skills', icon: 'ribbon-outline', route: '/SkillsScreen' },
    { name: 'Marketplace', icon: 'cart-outline', route: '/MarketplaceScreen' },
  ];

  const settingsItems = [
    { name: 'Paramètres', icon: 'settings-outline', route: '/SettingsScreen' },
    { name: 'Confidentialité', icon: 'shield-outline', route: '/PrivacyScreen' },
    { name: 'Partager', icon: 'share-social-outline', route: '/ShareScreen' },
    { name: 'Aide', icon: 'help-circle-outline', route: '/HelpScreen' },
  ];

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
    router.replace('/login');
  };

  const renderDrawerItem = (item) => (
    <TouchableOpacity
      key={item.route}
      style={[styles.drawerItem, isActive(item.route) && styles.activeItem]}
      onPress={() => router.push(item.route)}
    >
      <Ionicons name={item.icon} size={22} color={isActive(item.route) ? colors.activeItem : colors.drawerIcon} />
      <Text style={[styles.drawerItemLabel, isActive(item.route) && styles.activeItemLabel]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.menuText}>RoadBook Tracker</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        {/* Main Items Section */}
        <View style={styles.section}>{mainItems.map(renderDrawerItem)}</View>

        {/* Community Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Communauté</Text>
          </View>
          {communityItems.map(renderDrawerItem)}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Réglages</Text>
          </View>
          {settingsItems.map(renderDrawerItem)}
        </View>

        {/* Logout option */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.red} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer */}
      <TouchableOpacity style={styles.aboutButton} onPress={() => router.push('/AboutUsScreen')}>
        <Ionicons name="people" size={20} color={colors.darkerBlue} />
        <Text style={styles.aboutText}>À propos de nous</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.separation,
  },
  menuText: {
    color: colors.secondaryText,
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerContent: {
    paddingTop: 10,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.separation,
  },
  sectionHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeItem: {
    backgroundColor: colors.activeItem,
    borderLeftWidth: 3,
    borderLeftColor: colors.activeItem,
  },
  drawerItemLabel: {
    color: colors.secondaryText,
    fontSize: 16,
    marginLeft: 32,
  },
  activeItemLabel: {
    color: '#fff',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: colors.separation,
  },
  logoutText: {
    color: colors.red,
    marginLeft: 32,
    fontSize: 16,
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: colors.separation,
  },
  aboutText: {
    color: colors.secondaryText,
    fontSize: 14,
    textAlign: 'center',
    marginLeft: 8,
  },
});

export default CustomDrawerContent;
