import React, { useCallback, useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { useTheme } from '../../constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';

interface CustomSliderProps {
  value: number;
  onValueChange: (value: number[]) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  containerStyle?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
}

const PersonnalisedHandle = () => {
  const theme = useTheme();
  return (
    <View style={styles.thumbWrapper}>
      <AntDesign name="right" size={29} color={theme.colors.primary} />
    </View>
  );
};

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  min = 0,
  max = 1,
  step = 0.05,
  containerStyle,
  trackStyle,
}) => {
  const theme = useTheme();

  return (
    <Slider
      value={value}
      onValueChange={onValueChange}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      minimumValue={min}
      maximumValue={max}
      step={step}
      minimumTrackTintColor={theme.colors.primary}
      maximumTrackTintColor={theme.colors.secondary}
      renderThumbComponent={() => <PersonnalisedHandle />}
      containerStyle={[styles.sliderContainer, containerStyle]}
      trackStyle={[styles.trackStyle, trackStyle]}
    />
  );
};

const styles = {
  sliderContainer: {
    width: 140,
    height: 30,
    marginRight: 10,
  } as StyleProp<ViewStyle>,
  trackStyle: {
    height: 3,
    borderRadius: 1.3,
  } as StyleProp<ViewStyle>,
  thumbWrapper: {
    width: 26,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  } as StyleProp<ViewStyle>,
};
