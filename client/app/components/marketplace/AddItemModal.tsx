import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
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

const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSubmit,
  isUploading
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: 0,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newItem.title || !newItem.description || newItem.price <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Champs manquants',
        text2: 'Veuillez remplir tous les champs requis',
        position: 'bottom'
      });
      return;
    }

    if (!selectedImage) {
      Toast.show({
        type: 'error',
        text1: 'Image manquante',
        text2: 'Veuillez sélectionner une image',
        position: 'bottom'
      });
      return;
    }

    const success = await onSubmit({
      ...newItem,
      sellerName: currentUser.displayName || 'Anonyme',
      sellerId: currentUser.id
    }, selectedImage);

    if (success) {
      setNewItem({ title: '', description: '', price: 0 });
      setSelectedImage(null);
      onClose();
    }
  };

  const handleImageSelection = async () => {
    // Implémentez ici la logique de sélection d'image
    // Exemple avec expo-image-picker:
    /*
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
    }
    */
    Toast.show({
      type: 'info',
      text1: 'Fonctionnalité image',
      text2: 'La sélection d\'image sera implémentée ici',
      position: 'bottom'
    });
  };

  if (!visible) return null;

  return (
    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.modalHeader, { padding: spacing.md }]}>
        <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
          Nouvel article
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.backgroundText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ padding: spacing.md }}>
        <Input
          placeholder="Titre"
          value={newItem.title}
          onChangeText={text => setNewItem({ ...newItem, title: text })}
        />

        <Input
          placeholder="Description"
          multiline
          numberOfLines={4}
          value={newItem.description}
          onChangeText={text => setNewItem({ ...newItem, description: text })}
          style={{ height: 100, marginVertical: spacing.sm }}
        />

        <Input
          placeholder="Prix"
          keyboardType="numeric"
          value={newItem.price > 0 ? newItem.price.toString() : ''}
          onChangeText={text => {
            const num = parseFloat(text);
            setNewItem({ ...newItem, price: isNaN(num) ? 0 : num });
          }}
        />

        <Button
          label="Sélectionner une image"
          icon="image-outline"
          onPress={handleImageSelection}
          type="secondary"
          style={{ marginBottom: spacing.sm }}
        />

        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={[
              styles.previewImage,
              {
                borderRadius: borderRadius.small,
                height: 150,
                width: '100%',
                marginBottom: spacing.sm
              }
            ]}
            resizeMode="contain"
          />
        )}

        <View style={[styles.modalButtons, { marginTop: spacing.sm }]}>
          <Button
            label="Annuler"
            onPress={onClose}
            type="secondary"
            style={{ flex: 1, marginRight: spacing.sm }}
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
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing.md }}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  previewImage: {
    alignSelf: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    paddingTop: 12
  }
});

export default AddItemModal;