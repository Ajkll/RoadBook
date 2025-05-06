// app/components/LogViewer.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { CopyToClipboard } from '../common/ClipBoardCopy';
import { logger } from '../../utils/logger';

export const LogViewer = () => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const logs = logger.getLogs(filter);

  const levelColors = {
    DEBUG: theme.colors.textSecondary,
    INFO: theme.colors.success,
    WARN: theme.colors.warning,
    ERROR: theme.colors.error
  };

  const logsText = logs.map(l => `[${l.level}] ${l.timestamp.toLocaleTimeString()} ${l.message}`).join('\n');

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles(theme).collapsedContainer}
        onPress={() => setIsExpanded(true)}
      >
        <Text style={styles(theme).collapsedTitle}>Journal des logs</Text>
        <MaterialIcons name="more-vert" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles(theme).container}>
      <TouchableOpacity
        style={styles(theme).header}
        onPress={() => setIsExpanded(false)}
      >
        <Text style={styles(theme).sectionTitle}>Journal des logs</Text>
        <MaterialIcons name="keyboard-arrow-up" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <View style={styles(theme).section}>
        <View style={styles(theme).filterRow}>
          {['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'].map(lvl => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles(theme).filterButton,
                filter === lvl && { backgroundColor: theme.colors.primaryLight }
              ]}
              onPress={() => setFilter(lvl as any)}
            >
              <Text style={styles(theme).filterText}>{lvl}</Text>
            </TouchableOpacity>
          ))}
          <CopyToClipboard
            text={logsText}
            iconSize={18}
            containerStyle={styles(theme).copyButton}
          />
        </View>

        <ScrollView style={styles(theme).logsContainer}>
          {logs.length === 0 ? (
            <Text style={styles(theme).noLogsText}>Aucun log à afficher</Text>
          ) : (
            logs.map(log => (
              <View key={log.id} style={styles(theme).logEntry}>
                <Text style={[styles(theme).logLevel, { color: levelColors[log.level] }]}>
                  {log.level}
                </Text>
                <Text style={styles(theme).logMessage}>{log.message}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.xl,
  },
  collapsedContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadow.xl,
  },
  collapsedTitle: {
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  filterText: {
    fontSize: theme.typography.subtitle.fontSize,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  copyButton: {
    marginLeft: 'auto',
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.secondary,
  },
  noLogsText: {
    textAlign: 'center',
    padding: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  logEntry: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logLevel: {
    fontWeight: 'bold',
    minWidth: 50,
    fontSize: theme.typography.caption.fontSize,
  },
  logMessage: {
    flex: 1,
    fontSize: theme.typography.caption.fontSize,
  },
});