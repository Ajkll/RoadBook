// client/app/components/layout/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../constants/theme';

// Fonction utilitaire pour créer un élément de menu
const DrawerItem = ({ label, onPress, active = false, colors }) => (
  <TouchableOpacity
    style={[
      styles.drawerItem,
      active && { backgroundColor: colors.primary + '20' }, // 20% opacity
    ]}
    onPress={onPress}
  >
    <Text style={[styles.drawerItemText, { color: active ? colors.primary : colors.text }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Composant principal du tiroir personnalisé
export default function CustomDrawerContent(props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  // Obtenir le chemin actuel pour mettre en évidence l'élément actif
  const currentRoute = props.state?.routes[props.state.index]?.name || '';

  // Fonction pour naviguer vers une route
  const navigateTo = (route) => {
    props.navigation.closeDrawer();
    router.push(route);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
      style={{ backgroundColor: colors.background }}
    >
      {/* En-tête du tiroir avec les infos de l'utilisateur */}
      <View style={[styles.drawerHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: user?.profilePicture || 'https://via.placeholder.com/100' }}
            style={styles.userAvatar}
          />
          <View>
            <Text style={[styles.userName, { color: colors.white }]}>
              {user?.displayName || 'Utilisateur'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.white + 'CC' }]}>
              {user?.email || 'email@example.com'}
            </Text>
          </View>
        </View>
      </View>

      {/* Liste des éléments de menu */}
      <ScrollView style={styles.drawerContent}>
        <DrawerItem
          label="Accueil"
          onPress={() => navigateTo('/(tabs)')}
          active={currentRoute === '(tabs)'}
          colors={colors}
        />
        <DrawerItem
          label="Dashboard"
          onPress={() => navigateTo('/DashboardScreen')}
          active={currentRoute === 'DashboardScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Mon Carnet"
          onPress={() => navigateTo('/MyRoadbookScreen')}
          active={currentRoute === 'MyRoadbookScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Mes trajets"
          onPress={() => navigateTo('/MyRoutesScreen')}
          active={currentRoute === 'MyRoutesScreen'}
          colors={colors}
        />

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: colors.text + '99' }]}>Communauté</Text>
        <DrawerItem
          label="Communauté"
          onPress={() => navigateTo('/CommunityScreen')}
          active={currentRoute === 'CommunityScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Mentors"
          onPress={() => navigateTo('/MentorsScreen')}
          active={currentRoute === 'MentorsScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Compétences"
          onPress={() => navigateTo('/SkillsScreen')}
          active={currentRoute === 'SkillsScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Marketplace"
          onPress={() => navigateTo('/MarketplaceScreen')}
          active={currentRoute === 'MarketplaceScreen'}
          colors={colors}
        />

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: colors.text + '99' }]}>Paramètres</Text>
        <DrawerItem
          label="Profil"
          onPress={() => navigateTo('/ProfileScreen')}
          active={currentRoute === 'ProfileScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Paramètres"
          onPress={() => navigateTo('/SettingsScreen')}
          active={currentRoute === 'SettingsScreen'}
          colors={colors}
        />
        <DrawerItem
          label="Aide"
          onPress={() => navigateTo('/HelpScreen')}
          active={currentRoute === 'HelpScreen'}
          colors={colors}
        />
        <DrawerItem
          label="À propos"
          onPress={() => navigateTo('/AboutUsScreen')}
          active={currentRoute === 'AboutUsScreen'}
          colors={colors}
        />
      </ScrollView>

      {/* Bouton de déconnexion en bas */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
          onPress={logout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 8,
  },
  drawerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  drawerItemText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
