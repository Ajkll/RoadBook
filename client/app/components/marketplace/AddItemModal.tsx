import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Input from "../common/Input";
import Button from '../common/Button';
import Toast from 'react-native-toast-message';
// Ajoutez cette importation
import * as ImagePicker from 'expo-image-picker';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSubmit: (item: Omit<MarketplaceItem, 'id' | 'createdAt'>, imageUri: string) => Promise<boolean>;
  isUploading: boolean;
}

const INITIAL_ITEM_STATE = {
  title: '',
  description: '',
  price: 0,
};

const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSubmit,
  isUploading
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const [newItem, setNewItem] = useState(INITIAL_ITEM_STATE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  // Fonction pour demander les permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre galerie photo pour sélectionner une image.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Paramètres',
            onPress: () => {
              // Ouvrir les paramètres de l'app si possible
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return false;
    }
    return true;
  };

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Validation temporaire sans image requise
    if (!newItem.title.trim()) {
      errors.title = 'Le titre est requis';
    } else if (newItem.title.length < 3) {
      errors.title = 'Le titre doit contenir au moins 3 caractères';
    } else if (newItem.title.length > 50) {
      errors.title = 'Le titre ne peut pas dépasser 50 caractères';
    }

    if (!newItem.description.trim()) {
      errors.description = 'La description est requise';
    } else if (newItem.description.length < 10) {
      errors.description = 'La description doit contenir au moins 10 caractères';
    } else if (newItem.description.length > 500) {
      errors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    if (newItem.price <= 0) {
      errors.price = 'Le prix doit être supérieur à 0';
    } else if (newItem.price > 10000) {
      errors.price = 'Le prix ne peut pas dépasser 10 000€';
    }

    // Image validation temporairement désactivée
    // if (!selectedImage) {
    //   errors.image = 'Une image est requise';
    // }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newItem, selectedImage]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Formulaire incomplet',
        text2: 'Veuillez corriger les erreurs et réessayer',
        position: 'bottom'
      });
      return;
    }

    try {
      const success = await onSubmit({
        ...newItem,
        sellerName: currentUser?.displayName || currentUser?.name || 'Anonyme',
        sellerId: currentUser?.id || currentUser?.uid
      }, selectedImage!);

      if (success) {
        resetForm();
        Toast.show({
          type: 'success',
          text1: 'Article publié',
          text2: 'Votre article a été publié avec succès',
          position: 'bottom'
        });
        onClose();
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Une erreur est survenue lors de la publication',
        position: 'bottom'
      });
    }
  }, [newItem, selectedImage, currentUser, onSubmit, onClose, validateForm]);

  const resetForm = useCallback(() => {
    setNewItem(INITIAL_ITEM_STATE);
    setSelectedImage(null);
    setValidationErrors({});
  }, []);

  const handleClose = useCallback(() => {
    if (newItem.title || newItem.description || newItem.price > 0 || selectedImage) {
      Alert.alert(
        'Abandonner les modifications',
        'Êtes-vous sûr de vouloir fermer ? Vos modifications seront perdues.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Fermer',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  }, [newItem, selectedImage, resetForm, onClose]);

  // Fonction pour sélectionner une image depuis la galerie
  const selectImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setValidationErrors(prev => ({ ...prev, image: '' }));
        Toast.show({
          type: 'success',
          text1: 'Image sélectionnée',
          text2: 'Image ajoutée avec succès',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error selecting image from gallery:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sélectionner l\'image',
        position: 'bottom'
      });
    }
  };

  // Fonction pour prendre une photo avec la caméra
  const takePhotoWithCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin d\'accéder à votre caméra pour prendre une photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setValidationErrors(prev => ({ ...prev, image: '' }));
        Toast.show({
          type: 'success',
          text1: 'Photo prise',
          text2: 'Photo ajoutée avec succès',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de prendre la photo',
        position: 'bottom'
      });
    }
  };

  // Fonction principale pour gérer la sélection d'image
  const handleImageSelection = useCallback(async () => {
    Alert.alert(
      'Sélectionner une image',
      'Comment souhaitez-vous ajouter une image ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Galerie',
          onPress: selectImageFromGallery,
          style: 'default'
        },
        {
          text: 'Caméra',
          onPress: takePhotoWithCamera,
          style: 'default'
        }
      ]
    );
  }, []);

  const handlePriceChange = useCallback((text: string) => {
    // Allow only numbers and decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanText);
    setNewItem(prev => ({
      ...prev,
      price: isNaN(num) ? 0 : Math.round(num * 100) / 100 // Round to 2 decimal places
    }));

    if (validationErrors.price) {
      setValidationErrors(prev => ({ ...prev, price: '' }));
    }
  }, [validationErrors.price]);

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
        <View style={[styles.modalHeader, { padding: spacing.md, borderBottomColor: colors.ui.card.border }]}>
          <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
            Nouvel article
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.backgroundText} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            placeholder="Titre de l'article"
            value={newItem.title}
            onChangeText={(text) => {
              setNewItem(prev => ({ ...prev, title: text }));
              if (validationErrors.title) {
                setValidationErrors(prev => ({ ...prev, title: '' }));
              }
            }}
            error={validationErrors.title}
            maxLength={50}
            style={{ marginBottom: spacing.sm }}
          />

          <Input
            placeholder="Description détaillée"
            multiline
            numberOfLines={4}
            value={newItem.description}
            onChangeText={(text) => {
              setNewItem(prev => ({ ...prev, description: text }));
              if (validationErrors.description) {
                setValidationErrors(prev => ({ ...prev, description: '' }));
              }
            }}
            error={validationErrors.description}
            maxLength={500}
            style={{ height: 100, marginBottom: spacing.sm }}
          />

          <Input
            placeholder="Prix en euros"
            keyboardType="decimal-pad"
            value={newItem.price > 0 ? newItem.price.toString() : ''}
            onChangeText={handlePriceChange}
            error={validationErrors.price}
            style={{ marginBottom: spacing.md }}
            leftElement={
              <Text style={[styles.currencySymbol, { color: colors.backgroundTextSoft }]}>
                €
              </Text>
            }
          />

          {/* Bouton de sélection d'image temporairement désactivé */}
          {/* <Button
            label={selectedImage ? "Changer l'image" : "Sélectionner une image"}
            icon={selectedImage ? "camera" : "image-outline"}
            onPress={handleImageSelection}
            type="secondary"
            style={{ marginBottom: spacing.sm }}
          /> */}

          {/* Message informatif à la place */}
          <View style={[styles.infoContainer, { backgroundColor: colors.ui.card.background, marginBottom: spacing.sm }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.backgroundTextSoft} />
            <Text style={[styles.infoText, { color: colors.backgroundTextSoft }]}>
              La fonctionnalité d'ajout d'images est temporairement désactivée
            </Text>
          </View>

          {/* Validation d'image temporairement désactivée */}
          {/* {validationErrors.image && (
            <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>
              {validationErrors.image}
            </Text>
          )} */}

          {selectedImage && (
            <View style={[styles.imageContainer, { marginBottom: spacing.md }]}>
              <Image
                source={{ uri: selectedImage }}
                style={[
                  styles.previewImage,
                  { borderRadius: borderRadius.small }
                ]}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  setSelectedImage(null);
                  setValidationErrors(prev => ({ ...prev, image: 'Une image est requise' }));
                }}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.modalButtons, { marginTop: spacing.md }]}>
            <Button
              label="Annuler"
              onPress={handleClose}
              type="secondary"
              style={{ flex: 1, marginRight: spacing.sm }}
              disabled={isUploading}
            />

            <Button
              label={isUploading ? 'Publication...' : 'Publier'}
              onPress={handleSubmit}
              disabled={isUploading}
              type="primary"
              style={{ flex: 1 }}
              icon={isUploading ? undefined : 'cloud-upload-outline'}
            />
          </View>

          {isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: spacing.md }}
              />
              <Text style={[styles.uploadingText, { color: colors.backgroundTextSoft }]}>
                Publication en cours...
              </Text>
            </View>
          )}
        </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingTop: 16,
  },
  uploadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  uploadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default AddItemModal;