import React, { useState } from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity, Text, TextInput, StyleSheet } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { useTheme } from '../../constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';

interface CustomSliderProps {
  value: number | number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  containerStyle?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  containerStyle,
  trackStyle,
}) => {
  const theme = useTheme();
  const sliderValue = Array.isArray(value) ? value : [value];
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleManualInput = (index: number) => {
    setEditingValue(sliderValue[index].toString());
    setEditingIndex(index);
  };

  const saveManualInput = () => {
    if (editingIndex === null) return;

    const numValue = Math.max(min, Math.min(max, parseFloat(editingValue) || min));
    let newValues = [...sliderValue];
    newValues[editingIndex] = numValue;

    // Gestion des conflits min ou max
    if (newValues.length === 2) {
      if (editingIndex === 0 && newValues[0] > newValues[1]) {
        newValues[1] = newValues[0];
      } else if (editingIndex === 1 && newValues[1] < newValues[0]) {
        newValues[0] = newValues[1];
      }
    }

    onValueChange(newValues);
    setEditingIndex(null);
  };

  const ThumbComponent = () => (
    <View style={styles.thumbWrapper}>
      {AntDesign ? (
        <AntDesign name="right" size={29} color={theme.colors.primary} />
      ) : (
        <View style={[styles.fallbackThumb, { backgroundColor: theme.colors.primary }]} />
      )}
    </View>
  );

  return (
    <View>
      {/* Display current values with edit buttons */}
      <View style={styles.valuesContainer}>
        {sliderValue.map((val, index) => (
          <View key={index} style={styles.valueRow}>
            {editingIndex === index ? (
              <TextInput
                style={[
                  styles.valueInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.backgroundText,
                    backgroundColor: theme.colors.ui.card.background
                  }
                ]}
                value={editingValue}
                onChangeText={setEditingValue}
                keyboardType="numeric"
                onSubmitEditing={saveManualInput}
                onBlur={saveManualInput}
                autoFocus
              />
            ) : (
              <TouchableOpacity
                style={[
                  styles.valueButton,
                  { backgroundColor: theme.colors.ui.card.background }
                ]}
                onPress={() => handleManualInput(index)}
              >
                <Text style={[styles.valueText, { color: theme.colors.primary }]}>
                  {sliderValue.length > 1 ? `${index === 0 ? 'Min:' : 'Max:'} ${val}` : `${val}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <Slider
        value={sliderValue}
        onValueChange={onValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.secondary}
        renderThumbComponent={ThumbComponent}
        containerStyle={[styles.sliderContainer, containerStyle]}
        trackStyle={[styles.trackStyle, trackStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: '100%',
    height: 30,
    marginRight: 10,
  },
  trackStyle: {
    height: 3,
    borderRadius: 1.3,
  },
  thumbWrapper: {
    width: 26,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  valueRow: {
    flex: 1,
    marginHorizontal: 5,
  },
  valueButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fallbackThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  valueInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

// to do quand on la connectione st perdue il perd l'acces a AntDesign donc on a pas de handle quand je remet la co ou alors c'est un bug mais j'ai fait un trajet ofline puis je suis venue sur cette page pour verifier que mon trajet ofline est bien la (il l'etait) mais j'ia aps d'handle bizard