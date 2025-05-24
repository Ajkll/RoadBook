import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setShouldAskForComment } from '../../store/slices/commentSlice';
import { useTheme } from '../../constants/theme';

const DONT_ASK_KEY = '@dontAskForComments';

const CommentToggle = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { shouldAskForComment } = useSelector((state: RootState) => state.comment);
  const [isEnabled, setIsEnabled] = useState(!shouldAskForComment);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const value = await AsyncStorage.getItem(DONT_ASK_KEY);
        setIsEnabled(value === 'true');
      } catch (error) {
        console.log('Error loading comment preference:', error);
      }
    };

    loadPreference();
  }, []);

  const toggleSwitch = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    try {
      await AsyncStorage.setItem(DONT_ASK_KEY, String(newValue));
      dispatch(setShouldAskForComment(!newValue));
    } catch (error) {
      console.log('Error saving comment preference:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.ui.background }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        Demander un commentaire après chaque trajet
      </Text>
      <Switch
        trackColor={{ false: theme.colors.secondary, true: theme.colors.primary }}
        thumbColor={theme.colors.ui.button.primaryText}
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    flex: 1,
    marginRight: 16,
  },
});

export default CommentToggle;