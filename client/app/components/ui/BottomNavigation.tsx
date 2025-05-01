import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { stopTracking } from '../../store/slices/locationSlice';
import {
  startChrono,
  finishChrono,
  setShouldSave,
} from '../../store/slices/chronoSlice';
import SessionEndModal from '../modals/SessionEndModal';
import { useNotifications } from '../NotificationHandler';

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dispatch = useDispatch();
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { showError } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const isChronoRunning = useSelector((state: RootState) => state.chrono.isRunning);
  const mapReady = useSelector((state: RootState) => state.location.mapReady);

  const normalizedPathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const isActive = (path: string) => normalizedPathname === path;
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleStartDrivePress = () => {
    if (isActive('start-drive')) {
      if (!isChronoRunning) {
        if (!mapReady) {
          showError('⛔ Carte non prête', 'Veuillez attendre que la carte soit chargée', {
            position: 'center',
          });
          return;
        }
        dispatch(startChrono());
      } else {
        setShowModal(true);
      }
    } else {
      router.push('/(tabs)/start-drive');
    }
  };

  const handleLongPressStartDrive = () => {
    if (isChronoRunning) setShowModal(true);
  };

  const handleConfirmSave = () => {
    dispatch(finishChrono());
    dispatch(stopTracking());
    setShowModal(false);
  };

  const handleConfirmNoSave = () => {
    dispatch(setShouldSave(false));
    setTimeout(() => {
      dispatch(finishChrono());
      setShowModal(false);
    }, 50);
  };

  const handleCancel = () => setShowModal(false);

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/')}
        >
          <Ionicons
            name={isActive('') ? 'home' : 'home-outline'}
            size={24}
            color={isActive('') ? theme.colors.activeItem : theme.colors.inactiveItem}
          />
          <Text style={[
            styles.navText,
            { color: isActive('') ? theme.colors.activeItem : theme.colors.inactiveItem }
          ]}>
            Accueil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/explorer')}
        >
          <Ionicons
            name={isActive('explorer') ? 'search' : 'search-outline'}
            size={24}
            color={isActive('explorer') ? theme.colors.activeItem : theme.colors.inactiveItem}
          />
          <Text style={[
            styles.navText,
            { color: isActive('explorer') ? theme.colors.activeItem : theme.colors.inactiveItem }
          ]}>
            Explorer
          </Text>
        </TouchableOpacity>

        <Pressable
          style={styles.recordButton}
          onPress={handleStartDrivePress}
          onLongPress={handleLongPressStartDrive}
          delayLongPress={1600}
        >
          <View style={[
            styles.recordIcon,
            {
              backgroundColor: theme.colors.background,
              borderColor: isActive('start-drive')
                ? theme.colors.activeItem
                : theme.colors.inactiveItem,
            }
          ]}>
            <MaterialIcons
              name={isChronoRunning ? 'square' : 'circle'}
              size={isChronoRunning ? 30 : 40}
              color={isChronoRunning ? theme.colors.error : theme.colors.inactiveItem}
            />
          </View>
        </Pressable>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/my-routes')}
        >
          <Ionicons
            name={isActive('my-routes') ? 'map' : 'map-outline'}
            size={24}
            color={isActive('my-routes') ? theme.colors.activeItem : theme.colors.inactiveItem}
          />
          <Text style={[
            styles.navText,
            { color: isActive('my-routes') ? theme.colors.activeItem : theme.colors.inactiveItem }
          ]}>
            Mes trajets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons
            name={isActive('profile') ? 'person' : 'person-outline'}
            size={24}
            color={isActive('profile') ? theme.colors.activeItem : theme.colors.inactiveItem}
          />
          <Text style={[
            styles.navText,
            { color: isActive('profile') ? theme.colors.activeItem : theme.colors.inactiveItem }
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <SessionEndModal
        visible={showModal}
        onConfirmSave={handleConfirmSave}
        onConfirmNoSave={handleConfirmNoSave}
        onCancel={handleCancel}
      />
    </>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65,
    borderTopWidth: 1.6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 1000,
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  navText: {
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: theme.typography.caption.fontWeight,
  },
  recordButton: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    ...theme.shadow.md,
  },
  recordIcon: {
    width: 56,
    height: 56,
    padding: 0,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    ...theme.shadow.xl,
  },
});

export default BottomNavigation;