import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StartButtonModalProps {
  actionSheetRef: React.RefObject<ActionSheet>;
  onStartPress: () => void;
  isMapReady: boolean;
}

const StartButtonModal = ({
  actionSheetRef,
  onStartPress,
  isMapReady
}: StartButtonModalProps) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);

  const SNAP_POINTS = [160, 230];

  return (
    <>
      {overlayVisible && (
        <Pressable
          style={styles.overlay}
          onPress={() => {
            actionSheetRef.current?.snapToIndex(0);
            setIsExpanded(false);
            setOverlayVisible(false);
          }}
        />
      )}

      <ActionSheet
        ref={actionSheetRef}
        // sous la nav bar
        isModal={false}
        backgroundInteractionEnabled={true}
        zIndex={0}
        safeAreaInsets={insets}
        useBottomSafeAreaPadding
        drawUnderStatusBar={false}

        gestureEnabled
        snapPoints={SNAP_POINTS}
        initialSnapIndex={0}
        springOffset={SNAP_POINTS[0]}
        overdrawEnabled
        overdrawFactor={10}
        overdrawSize={50}
        enableContentPanningGesture={true}
        closable={false}
        closeOnTouchBackdrop={false}

        onSnapIndexChange={(index) => {
          const expanded = index === 1;
          setIsExpanded(expanded);
          setOverlayVisible(expanded);
        }}

        statusBarTranslucent
        containerStyle={styles.actionSheetContainer}
        indicatorStyle={styles.indicator}
      >
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => {
              const next = isExpanded ? 0 : 1;
              actionSheetRef.current?.snapToIndex(next);
              setIsExpanded(next === 1);
              setOverlayVisible(next === 1);
            }}
            style={styles.arrowButton}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
          >
            <MaterialIcons
              name={isExpanded ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
              size={40}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startButton,
              !isMapReady && styles.disabledButton
            ]}
            onPress={onStartPress}
            disabled={!isMapReady}
          >
            <Text style={styles.buttonText}>Commencer le trajet</Text>
          </TouchableOpacity>

          {!isMapReady && (
            <Text style={styles.loadingText}>
              Chargement de la carte en cours…
            </Text>
          )}
        </View>
      </ActionSheet>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9,
    },
    actionSheetContainer: {
      backgroundColor: theme.colors.ui.modal.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderColor: '#8E8E8E',
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      zIndex: 10,
      minHeight: 140,
    },
    indicator: {
      backgroundColor: theme.colors.primary,
      width: 120,
      height: 12,
      ...theme.shadow.md,
      marginTop: Platform.OS === 'android' ? 10 : 0,
    },
    container: {
      paddingTop: 20,
    },
    arrowButton: {
      width: '100%',
      alignItems: 'center',
      zIndex: 10,
      padding: 0,
      marginTop: -10,
    },
    startButton: {
      backgroundColor: theme.colors.primary,
      alignSelf: 'center',
      width: '80%',
      borderRadius: theme.borderRadius.xlarge,
      padding: 15,
      ...theme.shadow.md,
    },
    disabledButton: {
      backgroundColor: theme.colors.disabled,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 20,
      textAlign: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
      fontSize: 19,
      textAlign: 'center',
    },
  });

export default StartButtonModal;
