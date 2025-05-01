import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useSound } from '../../hooks/useSound';
import { SOUNDS, SoundKey } from '../../constants/sound';
import { useTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { CustomSlider } from '../common/CustomSlider';

const SoundCardParameters = () => {
  const theme = useTheme();
  const { setVolume, setMute, updateConfig, globalVolume, globalMute, getSoundConfig } = useSound();

  // Sons à exclure
  const excludedSounds: SoundKey[] = ['silent'];
  const soundKeys = useMemo(
    () =>
      Object.keys(SOUNDS).filter((key) => !excludedSounds.includes(key as SoundKey)) as SoundKey[],
    []
  );

  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [sliderValue, setSliderValue] = useState(globalVolume);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    if (!isSliding) {
      setSliderValue(globalVolume);
    }
  }, [globalVolume, isSliding]);

  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue(value[0]);
  }, []);

  const handleSliderStart = useCallback(() => {
    setIsSliding(true);
  }, []);

  const handleSliderComplete = useCallback(
    (value: number[]) => {
      setVolume(value[0]);
      setIsSliding(false);
    },
    [setVolume]
  );

  const styles = useMemo(() => createStyles(theme), [theme]);

  const soundItems = useMemo(
    () =>
      soundKeys.map((soundKey) => {
        const config = getSoundConfig(soundKey) || SOUNDS[soundKey].defaultConfig;
        return (
          <View key={soundKey} style={styles.soundItem}>
            <View style={styles.controlRow}>
              <Text style={styles.text}>{soundKey.replace('_', ' ')}</Text>
              <Switch
                value={config.isMuted}
                onValueChange={(value) => updateConfig(soundKey, { isMuted: value })}
                trackColor={{ false: theme.colors.secondary, true: theme.colors.primary }}
                thumbColor={theme.colors.background}
              />
            </View>
          </View>
        );
      }),
    [soundKeys, getSoundConfig, styles, theme, updateConfig]
  );

  if (!isCardExpanded) {
    return (
      <TouchableOpacity style={styles.collapsedContainer} onPress={() => setIsCardExpanded(true)}>
        <Text style={styles.collapsedTitle}>Paramètres Audio</Text>
        <MaterialIcons name="more-vert" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setIsCardExpanded(false)}>
        <Text style={styles.sectionTitle}>Paramètres Audio</Text>
        <MaterialIcons name="keyboard-arrow-up" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.controlRow}>
          <Text style={styles.text}>Volume global: {sliderValue.toFixed(1)}</Text>
          <CustomSlider
            value={sliderValue}
            onValueChange={handleSliderChange}
            onSlidingStart={handleSliderStart}
            onSlidingComplete={handleSliderComplete}
            containerStyle={styles.sliderContainer}
            trackStyle={styles.trackStyle}
          />
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.text}>Désactiver tous les sons:</Text>
          <Switch
            value={globalMute}
            onValueChange={setMute}
            trackColor={{ false: theme.colors.ui.card.background, true: theme.colors.primary }}
            thumbColor={theme.colors.background}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.advancedHeader}
        onPress={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
      >
        <Text style={styles.sectionTitle}>Options avancées</Text>
        <MaterialIcons
          name={isAdvancedExpanded ? 'keyboard-arrow-down' : 'more-vert'}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {isAdvancedExpanded && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres par Son</Text>
          <ScrollView style={styles.scrollContainer}>{soundItems}</ScrollView>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
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
    advancedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    section: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      ...theme.shadow.xm,
    },
    sectionTitle: {
      fontSize: theme.typography.title.fontSize,
      fontWeight: theme.typography.title.fontWeight,
      color: theme.colors.primary,
    },
    controlRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: theme.spacing.xs,
    },
    text: {
      color: theme.colors.backgroundText,
      fontSize: theme.typography.subtitle.fontSize,
      paddingLeft: theme.spacing.xl,
    },
    sliderContainer: {
      width: 140,
      height: 40,
      marginRight: 10,
    },
    trackStyle: {
      height: 4,
      borderRadius: 2,
    },
    soundItem: {
      marginBottom: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      padding: theme.spacing.xm,
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
    },
    scrollContainer: {
      maxHeight: 200,
    },
  });

export default SoundCardParameters;
