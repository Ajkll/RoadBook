import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../constants/theme';
import SyncBadge from '../ui/SyncBadge';
import { MaterialIcons } from '@expo/vector-icons';
import { CopyToClipboard } from '../common/ClipBoardCopy';

const DrawerItem = ({
  label,
  onPress,
  active = false,
  theme,
  iconName,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  theme: Theme;
  iconName?: string;
}) => (
  <TouchableOpacity
    style={[
      styles.drawerItem,
      active && { backgroundColor: theme.colors.ui.button.primary + '20' },
    ]}
    onPress={onPress}
  >
    <View style={styles.itemContent}>
      {iconName && (
        <MaterialIcons
          name={iconName}
          size={theme.typography.subtitle.fontSize}
          color={active ? theme.colors.ui.button.primary : theme.colors.backgroundText}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.drawerItemText(theme),
          active && { color: theme.colors.ui.button.primary, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function CustomDrawerContent(props) {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const currentRoute = props.state?.routes[props.state.index]?.name || '';

  const navigateTo = (route: string) => {
    props.navigation.closeDrawer();
    router.push(route);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, paddingLeft: 0 }}
      style={styles.container(theme)}
    >
      {/* Header */}
      <View style={styles.drawerHeader(theme)}>
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: user?.profilePicture || 'https://via.placeholder.com/200' }}
            style={styles.userAvatar(theme)}
          />
          <View>
            <Text style={styles.userName(theme)}>{user?.displayName || 'Utilisateur : N/A'}</Text>
            <CopyToClipboard
              text={user?.email || 'email@example.com'}
              showText={true}
              iconSize={14}
              containerStyle={{ marginTop: 4 }}
            />
          </View>
        </View>
      </View>

      {/* Menu items */}
      <ScrollView style={styles.drawerContent}>
        <DrawerItem
          label="Accueil"
          onPress={() => navigateTo('/(tabs)')}
          active={currentRoute === '(tabs)'}
          theme={theme}
          iconName="home"
        />
        <DrawerItem
          label="Dashboard"
          onPress={() => navigateTo('/DashboardScreen')}
          active={currentRoute === 'DashboardScreen'}
          theme={theme}
          iconName="dashboard"
        />
        <DrawerItem
          label="Mon Carnet"
          onPress={() => navigateTo('/MyRoadbookScreen')}
          active={currentRoute === 'MyRoadbookScreen'}
          theme={theme}
          iconName="book"
        />
        <DrawerItem
          label="Mes trajets"
          onPress={() => navigateTo('/(tabs)/my-routes')}
          active={currentRoute === 'MyRoutesScreen'}
          theme={theme}
          iconName="directions"
        />

        <View style={styles.divider(theme)} />

        <Text style={styles.sectionTitle(theme)}>Communauté</Text>
        <DrawerItem
          label="Communauté"
          onPress={() => navigateTo('/CommunityScreen')}
          active={currentRoute === 'CommunityScreen'}
          theme={theme}
          iconName="people"
        />
        <DrawerItem
          label="Mentors"
          onPress={() => navigateTo('/MentorsScreen')}
          active={currentRoute === 'MentorsScreen'}
          theme={theme}
          iconName="school"
        />
        <DrawerItem
          label="Compétences"
          onPress={() => navigateTo('/SkillsScreen')}
          active={currentRoute === 'SkillsScreen'}
          theme={theme}
          iconName="star"
        />
        <DrawerItem
          label="Marketplace"
          onPress={() => navigateTo('/MarketplaceScreen')}
          active={currentRoute === 'MarketplaceScreen'}
          theme={theme}
          iconName="shopping-cart"
        />

        <View style={styles.divider(theme)} />

        <Text style={styles.sectionTitle(theme)}>Paramètres</Text>
        <DrawerItem
          label="Profil"
          onPress={() => navigateTo('/ProfileScreen')}
          active={currentRoute === 'ProfileScreen'}
          theme={theme}
          iconName="person"
        />
        <TouchableOpacity
          style={[
            styles.drawerItem,
            currentRoute === 'OfflineSyncScreen' && {
              backgroundColor: theme.colors.ui.button.primary + '20',
            },
          ]}
          onPress={() => navigateTo('/OfflineSyncScreen')}
        >
          <View style={styles.itemWithBadge}>
            <View style={styles.itemContent}>
              <MaterialIcons
                name="sync"
                size={theme.typography.subtitle.fontSize}
                color={
                  currentRoute === 'OfflineSyncScreen'
                    ? theme.colors.ui.button.primary
                    : theme.colors.backgroundText
                }
                style={styles.icon}
              />
              <Text
                style={[
                  styles.drawerItemText(theme),
                  currentRoute === 'OfflineSyncScreen' && {
                    color: theme.colors.ui.button.primary,
                    fontWeight: '600',
                  },
                ]}
              >
                Synchronisation Offline
              </Text>
            </View>
            <SyncBadge />
          </View>
        </TouchableOpacity>
        <DrawerItem
          label="Paramètres"
          onPress={() => navigateTo('/SettingsScreen')}
          active={currentRoute === 'SettingsScreen'}
          theme={theme}
          iconName="settings"
        />
        <DrawerItem
          label="Aide"
          onPress={() => navigateTo('/HelpScreen')}
          active={currentRoute === 'HelpScreen'}
          theme={theme}
          iconName="help"
        />
        <DrawerItem
          label="À propos"
          onPress={() => navigateTo('/AboutUsScreen')}
          active={currentRoute === 'AboutUsScreen'}
          theme={theme}
          iconName="info"
        />
      </ScrollView>

      {/* Logout button */}
      <View style={styles.logoutContainer(theme)}>
        <TouchableOpacity style={styles.logoutButton(theme)} onPress={logout}>
          <MaterialIcons
            name="logout"
            size={theme.typography.subtitle.fontSize}
            color={theme.colors.ui.button.dangerText}
            style={styles.icon}
          />
          <Text style={styles.logoutText(theme)}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = {
  container: (theme: Theme) => ({
    backgroundColor: theme.colors.background,
    zIndex: 1000,
    elevation: 1000,
    borderTopRightRadius: theme.borderRadius.xlarge,
    borderBottomRightRadius: theme.borderRadius.xlarge,
    marginLeft: 0,
    paddingLeft: 0,
    borderWidth: 5,
    borderColor: '#D8D8D0',
  }),
  drawerHeader: (theme: Theme) => ({
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: theme.borderRadius.xlarge,
    borderBottomRightRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.xl,
    marginLeft: -30, // React Navigation ajoute une marge au drawer donc on triche
    borderWidth: 6,
    borderTopColor: theme.colors.primary,
    borderRightColor: theme.colors.secondary,
    borderBottomColor: theme.colors.secondary,
    ...theme.shadow.xl,
  }),
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'top',
    paddingBottom: 50,
  },
  userAvatar: (theme: Theme) => ({
    width: '35%',
    height: ' 100%',
    marginLeft: -11,
    borderRadius: theme.borderRadius.xlarge,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
  }),
  userName: (theme: Theme) => ({
    fontSize: theme.typography.SuperTitle.fontSize,
    fontWeight: theme.typography.title.fontWeight as 'bold',
    color: theme.colors.primaryText,
    marginBottom: theme.spacing.xs,
  }),
  userEmail: (theme: Theme) => ({
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primaryTextSoft,
  }),
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
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
    padding: 5,
    fontSize: 22,
  },
  drawerItemText: (theme: Theme) => ({
    fontSize: theme.typography.subtitle.fontSize,
    color: theme.colors.backgroundText,
    fontSize: theme.typography.subtitle.fontSize,
  }),
  divider: (theme: Theme) => ({
    height: 2.3,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginLeft: -500,
    padding: 0,
    backgroundColor: theme.colors.border,
  }),
  sectionTitle: (theme: Theme) => ({
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight as 'bold',
    textTransform: 'uppercase',
    marginLeft: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    color: theme.colors.backgroundTextSoft,
    letterSpacing: 1,
  }),
  logoutContainer: (theme: Theme) => ({
    paddingTop: 15,
    paddingBottom: 10,
    borderTopWidth: 7,
    borderColor: theme.colors.secondary,
    borderTop: 20,
    borderRadius: 10,
  }),
  logoutButton: (theme: Theme) => ({
    padding: theme.spacing.sm,
    marginRight: '5%',
    borderRadius: theme.borderRadius.xlarge,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: theme.colors.ui.button.danger,
    ...theme.shadow.sm,
  }),
  logoutText: (theme: Theme) => ({
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight as 'bold',
    color: theme.colors.ui.button.dangerText,
    marginLeft: theme.spacing.sm,
  }),
  itemWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};

type Theme = ReturnType<typeof useTheme>;
