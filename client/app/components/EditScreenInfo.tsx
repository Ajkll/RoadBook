import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to RoadBook !</Text>
      <Text style={styles.path}>Path: {path}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 50,
    marginVertical: 20,
  },
  text: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  path: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
