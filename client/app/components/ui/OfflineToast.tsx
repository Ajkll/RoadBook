import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsConnected, selectIsInternetReachable } from '../../store/slices/networkSlice';
import { useTheme } from '../../constants/theme';
import { useNotifications } from '../NotificationHandler';

const OfflineToast = () => {
  const isConnected = useSelector(selectIsConnected);
  const IsInternetReachable = useSelector(selectIsInternetReachable);
  const theme = useTheme();
  const prevConnectedRef = useRef(true);
  const styles = createStyles(theme);
  const { showError } = useNotifications();
  const isOffline = !isConnected || !IsInternetReachable;

  useEffect(() => {
    if (prevConnectedRef.current === true && isOffline === true) {
      showError('⛔ Vous êtes hors ligne', "Les données seront synchronisées lorsque la connexion sera rétablie.", {
        position: 'bottom',
        visibilityTime: 3000,
      });
    } else if (prevConnectedRef.current === false && isOffline === false) {
      showSuccess('Connexion rétablie', "Synchronisation des données en cours....", {
        position: 'bottom',
        visibilityTime: 3000,
      });
    }

    prevConnectedRef.current = isOffline;
  }, [isOffline, theme.colors]);

  if (isOffline) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Pas de connexion Internet</Text>
      </View>
    );
  }

  return null;
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.xl,
      zIndex: 100,
      ...theme.shadow.md,
    },
    text: {
      fontWeight: theme.typography.button.fontWeight,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.error,
      backgroundColor: theme.colors.background + 'CC',
      borderRadius: theme.borderRadius.xlarge,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xl,
      ...theme.shadow.sm,
    },
  });

export default OfflineToast;
