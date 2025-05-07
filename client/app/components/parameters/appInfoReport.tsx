import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
}

export const AppInfo = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releasesExpanded, setReleasesExpanded] = useState(false);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.github.com/repos/Yanstart/RoadBook/releases');
      const data = await response.json();

      if (response.ok) {
        setReleases(data.slice(0, 3));
      } else {
        setError(data.message || 'Erreur lors de la récupération des releases');
      }
    } catch (err) {
      setError('Impossible de se connecter à GitHub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const openGithubRepo = () => Linking.openURL('https://github.com/Yanstart/RoadBook');

  const openBugReport = () => {
    const email = 'HE202326@students.ephec.be';
    const subject = 'Bug Report - RoadBook';
    const body = `\n\n---\nApp Version: ${Constants.expoConfig?.version}\nPlatform: ${Platform.OS}\nDevice: ${Constants.deviceName}`;
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderReleaseItem = (release: GitHubRelease) => (
    <View key={release.tag_name} style={styles.releaseItem}>
      <Text
        style={styles.releaseTitle}
        onPress={() => Linking.openURL(release.html_url)}
      >
        {release.name || release.tag_name}
      </Text>
      <Text style={styles.releaseDate}>{formatDate(release.published_at)}</Text>
      {release.body && (
        <Text style={styles.releaseBody} numberOfLines={2} ellipsizeMode="tail">
          {release.body}
        </Text>
      )}
    </View>
  );

  const renderReleases = () => {
    if (loading) return <ActivityIndicator size="small" color={theme.colors.ui.status.info} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (releases.length === 0) return <Text style={styles.emptyText}>Aucune release disponible</Text>;
    return releases.map(renderReleaseItem);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Paramètres Généraux</Text>

      <InfoItem label="Version" value={Constants.expoConfig?.version || 'N/A'} />
      <InfoItem label="Environnement" value={__DEV__ ? 'Développement' : 'Production'} />
      <InfoItem
        label="Plateforme"
        value={`${Platform.OS} ${Platform.Version ? `(API ${Platform.Version})` : ''}`}
      />

      <View style={styles.actions}>
        <Text style={styles.link} onPress={openGithubRepo}>
          Voir le code source
        </Text>
        <Text style={styles.link} onPress={openBugReport}>
          Signaler un bug
        </Text>
      </View>

      <TouchableOpacity
        style={styles.releasesHeader}
        onPress={() => setReleasesExpanded(!releasesExpanded)}
      >
        <Text style={styles.sectionTitle}>Dernières versions</Text>
        <MaterialIcons
          name={releasesExpanded ? 'keyboard-arrow-down' : 'more-vert'}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {releasesExpanded && (
        <View style={styles.releasesContainer}>
          {renderReleases()}
        </View>
      )}
    </View>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.infoItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const makeStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    borderColor: theme.colors.border,
    borderWidth: 1,
    ...theme.shadow.xl,
  },
  mainTitle: {
    ...theme.typography.header,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  title: {
    ...theme.typography.title,
    marginBottom: theme.spacing.md,
    color: theme.colors.primaryText,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.backgroundTextSoft,
  },
  value: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.backgroundText,
  },
  releasesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.secondary,
    borderTopColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  releasesContainer: {
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.primary,
    marginLeft: 10,
  },
  releaseItem: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    marginLeft: 10,
    borderBottomColor: theme.colors.border,
  },
  releaseTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  releaseDate: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.xs,
  },
  releaseBody: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.backgroundText,
  },
  emptyText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.backgroundTextSoft,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.error,
  },
  actions: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  link: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.ui.status.info,
    marginBottom: theme.spacing.sm,
  },
});