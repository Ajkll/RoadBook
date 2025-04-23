import React, {useMemo, useCallback, useState} from 'react';
import { Modalize } from 'react-native-modalize';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


const StartButtonModal = ({ modalizeRef, onStartPress, isMapReady }: StartButtonModalProps) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isExpanded, setIsExpanded] = useState(false);

   const handlePositionChange = useCallback((position: 'initial' | 'top' | number) => {
    if (position === 340 || position === 'top') {
      setIsExpanded(true);
    } else if (position === 140 || position === 'initial') {
      setIsExpanded(false);
    }
  }, []);


  const handleArrowPress = useCallback(() => {
    if (modalizeRef.current) {
      if (isExpanded) {
        modalizeRef.current.open(140);
      } else {
        modalizeRef.current.open('top');
      }
    }
  }, [isExpanded, modalizeRef]);

  return (
    <Modalize
      ref={modalizeRef}
      snapPoint={340}
      modalHeight={400}
      handlePosition="inside"
      handleStyle={{
        backgroundColor: theme.colors.primary,
        width: 80,
        height: 8,
        ...theme.shadow.md,
        marginTop: Platform.OS === 'android' ? 10 : 0,
      }}
      modalStyle={{
        backgroundColor: theme.colors.ui.modal.background,
        borderColor: 'grey',
        borderWidth: 2,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: Platform.OS === 'android' ? 30 : 0,
        zIndex: 100,
        elevation: 100,
      }}
      withOverlay={isExpanded} // <-- Ici on contrôle dynamiquement l'overlay
      overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      alwaysOpen={140}
      disableScrollIfPossible={false}
      openAnimationConfig={{
        spring: {
          speed: 14,
          bounciness: 8
        },
        timing: {
          duration: 300,
          easing: 'easeOut'
        }
      }}
      closeOnOverlayTap={false}
      onPositionChange={handlePositionChange}
    >
      <GestureHandlerRootView style={{flex:1}}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={handleArrowPress}
            style={styles.arrowButton}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
          >
            <MaterialIcons
              name={isExpanded ? "keyboard-arrow-down" : "keyboard-arrow-up"}
              size={45}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <Text style={styles.title}>Prêt à démarrer ?</Text>

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
            <Text style={styles.loadingText}>Chargement de la carte en cours...</Text>
          )}
        </View>
      </GestureHandlerRootView>
    </Modalize>
  );
};


// Styles inchangés (voir précédent)
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 30 : 20,
  },
  arrowButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: theme.borderRadius.xlarge,
    width: '100%',
    alignItems: 'center',
    ...theme.shadow.md
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 19,
  },
});

export default StartButtonModal;