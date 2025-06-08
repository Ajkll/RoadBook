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
  Alert,
  Linking
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Input from "../common/Input";
import Button from '../common/Button';
import Toast from 'react-native-toast-message';

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

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newItem, selectedImage]);

  const resetForm = useCallback(() => {
    setNewItem(INITIAL_ITEM_STATE);
    setSelectedImage(null);
    setValidationErrors({});
  }, []);

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

    if (!currentUser?.id && !currentUser?.uid) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Utilisateur non connecté',
        position: 'bottom'
      });
      return;
    }

    try {
      const itemData = {
        ...newItem,
        sellerName: currentUser?.displayName || currentUser?.name || currentUser?.email || 'Anonyme',
        sellerId: currentUser?.id || currentUser?.uid,
        sellerAvatar: currentUser?.photoURL || currentUser?.avatar || '',
        imageUrl: '',
      };

      const success = await onSubmit(itemData, selectedImage || '');

      if (success) {
        resetForm();
        Toast.show({
          type: 'success',
          text1: 'Article publié',
          text2: 'Votre article a été publié avec succès',
          position: 'bottom'
        });
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Échec de la publication de l\'article',
          position: 'bottom'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Une erreur est survenue lors de la publication: ' + (error.message || 'Erreur inconnue'),
        position: 'bottom'
      });
    }
  }, [newItem, selectedImage, currentUser, onSubmit, onClose, validateForm, resetForm]);

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

  const handlePriceChange = useCallback((text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanText);
    setNewItem(prev => ({
      ...prev,
      price: isNaN(num) ? 0 : Math.round(num * 100) / 100
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

          <View style={styles.characterCount}>
            <Text style={[styles.characterCountText, { color: colors.backgroundTextSoft }]}>
              {newItem.title.length}/50 caractères
            </Text>
          </View>

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

          <View style={styles.characterCount}>
            <Text style={[styles.characterCountText, { color: colors.backgroundTextSoft }]}>
              {newItem.description.length}/500 caractères
            </Text>
          </View>

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

          <View style={[styles.infoContainer, { backgroundColor: colors.ui.card.background, marginBottom: spacing.sm }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.backgroundTextSoft} />
            <Text style={[styles.infoText, { color: colors.backgroundTextSoft }]}>
              La fonctionnalité d'ajout d'images est temporairement désactivée. Vous pouvez publier votre article sans image.
            </Text>
          </View>

          <View style={[styles.previewContainer, { backgroundColor: colors.ui.card.background, marginBottom: spacing.md }]}>
            <Text style={[styles.previewTitle, { color: colors.backgroundText }]}>
              Aperçu de votre article
            </Text>
            <View style={styles.previewContent}>
              <Text style={[styles.previewItemTitle, { color: colors.backgroundText }]}>
                {newItem.title || 'Titre de l\'article'}
              </Text>
              <Text style={[styles.previewPrice, { color: colors.primary }]}>
                {newItem.price > 0 ? `${newItem.price.toFixed(2)}€` : '0.00€'}
              </Text>
              <Text style={[styles.previewSeller, { color: colors.backgroundTextSoft }]}>
                Vendeur: {currentUser?.displayName || currentUser?.name || currentUser?.email || 'Vous'}
              </Text>
              {newItem.description && (
                <Text style={[styles.previewDescription, { color: colors.backgroundTextSoft }]} numberOfLines={3}>
                  {newItem.description}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.modalButtons, { marginTop: spacing.md }]}>
            <Button
              label="Annuler"
              onPress={handleClose}
              type="secondary"
              style={{ flex: 1, marginRight: spacing.sm }}
              disabled={isUploading}
            />

            <Button
              label={isUploading ? 'Publication...' : 'Publier l\'article'}
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
                Publication en cours... Veuillez patienter.
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
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  characterCountText: {
    fontSize: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
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
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewSeller: {
    fontSize: 14,
  },
  previewDescription: {
    fontSize: 14,
    lineHeight: 20,
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
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
  },
});

export default AddItemModal;