import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingOverlayProps {
  loading: boolean;
}

export default function LoadingOverlay({ loading }: LoadingOverlayProps) {
  if (!loading) return null;
  
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#7CA7D8" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});