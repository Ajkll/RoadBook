import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useSound } from '../hooks/useSound';
import { SOUNDS } from '../constants/sound';

const SoundTestScreen = () => {
  const { play, globalMute, setMute } = useSound();

  return (
    <View style={styles.container}>
      <Button
        title={globalMute ? "Activer tous les sons" : "Désactiver tous les sons"}
        onPress={() => setMute(!globalMute)}
      />

      {Object.keys(SOUNDS).map((soundKey) => (
        <Button
          key={soundKey}
          title={`Jouer ${soundKey}`}
          onPress={() => play(soundKey as keyof typeof SOUNDS)}
          style={styles.button}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  button: {
    marginVertical: 5,
  },
});

export default SoundTestScreen;