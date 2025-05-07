import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsConnected, selectIsInternetReachable } from '../../store/slices/networkSlice';
import offlineImage from '../../assets/images/offlineBanner.png';
import { useTheme } from '../../constants/theme';

interface OfflineContentProps {
  message?: string;
  children?: React.ReactNode;
  showImage?: boolean;
  variant?: 'default' | 'compact' | 'full';
}

/**
 * Component to display when content fails to load due to network issues
 *
 * @param message Custom message to display (optional)
 * @param children Content to display when online (optional)
 * @param showImage Whether to show the offline banner image (default: true)
 * @param variant Display variant ('default', 'compact', 'full')
 */
const OfflineContent: React.FC<OfflineContentProps> = ({
  message = 'Vous êtes hors ligne. Certaines fonctionnalités ne sont pas disponibles.',
  children,
  showImage = true,
  variant = 'default',
}) => {
  const theme = useTheme();
  const isConnected = useSelector(selectIsConnected);
  const isInternetReachable = useSelector(selectIsInternetReachable);
  const styles = createStyles(theme, variant);

  const isOffline = !isConnected || !isInternetReachable;

  if (!isOffline && children) {
    return <>{children}</>;
  }

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      {showImage && variant !== 'compact' && (
        <Image
          source={offlineImage}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Illustration mode hors ligne"
        />
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const createStyles = (theme: any, variant: string) =>
  StyleSheet.create({
    container: {
      flex: variant === 'full' ? 1 : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[variant === 'compact' ? 'sm' : 'lg'],
      backgroundColor: variant === 'full' ? theme.colors.background : 'transparent',
    },
    image: {
      height: variant === 'default' ? 200 : 150,
      marginBottom: theme.spacing.md,
      opacity: theme.dark ? 0.9 : 1,
    },
    message: {
      textAlign: 'center',
      fontSize: theme.typography[variant === 'compact' ? 'caption' : 'body'].fontSize,
      color: theme.colors.backgroundTextSoft,
      lineHeight: variant === 'compact' ? 10 : 20,
      maxWidth: '90%',
    },
  });

export default OfflineContent;
