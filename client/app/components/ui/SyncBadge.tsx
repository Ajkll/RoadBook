import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectPendingCount } from '../../store/slices/syncSlice';
import { useTheme } from '../../constants/theme';

const SyncBadge: React.FC = () => {
  const theme = useTheme();
  const pendingCount = useSelector(selectPendingCount);
  const styles = createStyles(theme);

  if (pendingCount === 0) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: theme.borderRadius.xlarge,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xs,
      marginLeft: theme.spacing.sm,
      backgroundColor: theme.colors.error,
      ...theme.shadow.xs,
    },
    badgeText: {
      color: theme.colors.primaryText,
      fontSize: theme.typography.caption.fontSize,
      fontWeight: theme.typography.button.fontWeight,
    },
  });

export default SyncBadge;
