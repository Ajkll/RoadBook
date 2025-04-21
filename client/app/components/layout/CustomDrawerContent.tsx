import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../constants/theme';
import SyncBadge from '../ui/SyncBadge';


// Fonction utilitaire pour créer un élément de menu
const DrawerItem = ({ label, onPress, active = false, colors }) => (
  <TouchableOpacity
    style={[
      styles.drawerItem,
      active && { backgroundColor: colors.ui.button.primary + '20' },
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.drawerItemText,
      {
        color: active ? colors.ui.button.primary : colors.backgroundText,
        fontWeight: active ? '600' : 'normal'
      }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Composant principal du tiroir personnalisé
export default function CustomDrawerContent(props) {
  const router = useRouter();
  const { colors, dark } = useTheme();
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
      style={{
        backgroundColor: colors.background,
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      {/* En-tête du tiroir avec les infos de l'utilisateur */}
      <View style={[styles.drawerHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: user?.profilePicture || 'https://via.placeholder.com/100' }}
            style={styles.userAvatar}
          />
          <View>
            <Text style={[styles.userName, { color: colors.primaryText }]}>
              {user?.displayName || 'Utilisateur : N/A'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.primaryTextSoft }]}>
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

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionTitle, { color: colors.backgroundTextSoft }]}>
          Communauté
        </Text>
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

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionTitle, { color: colors.backgroundTextSoft }]}>
          Paramètres
        </Text>
        <DrawerItem
          label="Profil"
          onPress={() => navigateTo('/ProfileScreen')}
          active={currentRoute === 'ProfileScreen'}
          colors={colors}
        />
        <TouchableOpacity
          style={[
            styles.drawerItem,
            currentRoute === 'OfflineSyncScreen' && {
              backgroundColor: colors.ui.button.primary + '20'
            },
          ]}
          onPress={() => navigateTo('/OfflineSyncScreen')}
        >
          <View style={styles.itemWithBadge}>
            <Text
              style={[
                styles.drawerItemText,
                {
                  color: currentRoute === 'OfflineSyncScreen'
                    ? colors.ui.button.primary
                    : colors.backgroundText,
                  fontWeight: currentRoute === 'OfflineSyncScreen' ? '600' : 'normal'
                }
              ]}
            >
              Synchronisation Offline
            </Text>
            <SyncBadge />
          </View>
        </TouchableOpacity>
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
      <View style={[
        styles.logoutContainer,
        { borderTopColor: colors.border }
      ]}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.ui.button.danger + '20',
              borderColor: colors.ui.button.danger,
              borderWidth: 1,
            }
          ]}
          onPress={logout}
        >
          <Text style={[styles.logoutText]}>
            Déconnexion
          </Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    top : - 10,

  },
  userEmail: {
    fontSize: 16,
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
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  itemWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});