import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  addMarketplaceItem,
  getMarketplaceItems,
  MarketplaceItem,
  pickImage,
} from './services/firebase/marketplace';
import Card from './components/common/Card';
import { useTheme } from './constants/theme';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 32) / 2 - 8; // 2 colonnes avec marges

const MarketplaceScreen = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>>({
    title: '',
    description: '',
    price: 0,
    sellerName: 'Anonymous',
    sellerId: 'guest',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      await loadItems();
    };
    load();
  }, []);

  const loadItems = async () => {
    setRefreshing(true);
    try {
      const fetchedItems = await getMarketplaceItems();
      setItems(fetchedItems);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les articles',
        position: 'bottom',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission refusée',
          text2: 'Nous avons besoin d\'accéder à vos photos',
          position: 'bottom',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sélectionner l\'image',
        position: 'bottom',
      });
      console.error(error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title || !newItem.description || newItem.price <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Champs manquants',
        text2: 'Veuillez remplir tous les champs requis',
        position: 'bottom',
      });
      return;
    }

    setIsUploading(true);
    try {
      await addMarketplaceItem(newItem, selectedImage || '');
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article ajouté avec succès',
        position: 'bottom',
      });
      setShowAddModal(false);
      setNewItem({
        title: '',
        description: '',
        price: 0,
        sellerName: 'Anonymous',
        sellerId: 'guest',
      });
      setSelectedImage(null);
      await loadItems();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Échec de l'ajout de l'article",
        position: 'bottom',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderItem = ({ item }: { item: MarketplaceItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        // Navigation vers le détail du produit
        // router.push(`/marketplace/${item.id}`);
      }}
    >
      <Card style={{ flex: 1 }}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={[styles.gridImage, { borderRadius: borderRadius.small }]}
          resizeMode="cover"
        />
        <View style={styles.gridDetails}>
          <Text
            style={[styles.itemTitle, { color: colors.backgroundText }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.itemPrice, { color: colors.ui.button.primary }]}>
            {item.price.toFixed(2)}€
          </Text>
          <Text
            style={[styles.itemSeller, { color: colors.backgroundTextSoft }]}
            numberOfLines={1}
          >
            Par: {item.sellerName}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête */}
      <View style={[styles.header, { padding: spacing.md }]}>
        <Text style={[styles.title, { color: colors.backgroundText }]}>
          Marketplace
        </Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: colors.ui.button.primary,
              borderRadius: borderRadius.medium,
            },
          ]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.ui.button.primaryText} />
          <Text style={[styles.addButtonText, { color: colors.ui.button.primaryText }]}>
            Ajouter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des articles */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContainer}
        refreshing={refreshing}
        onRefresh={loadItems}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.backgroundTextSoft} />
            <Text style={[styles.emptyText, { color: colors.backgroundTextSoft }]}>
              Aucun article en vente pour le moment
            </Text>
          </View>
        }
      />

      {/* Modal d'ajout */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { padding: spacing.md }]}>
            <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
              Nouvel article
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.backgroundText} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: spacing.md }}>
            {/* Champs du formulaire */}
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.backgroundText,
                  backgroundColor: colors.ui.card.background,
                  marginBottom: spacing.sm,
                },
              ]}
              placeholder="Titre"
              placeholderTextColor={colors.backgroundTextSoft}
              value={newItem.title}
              onChangeText={(text) => setNewItem({ ...newItem, title: text })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.backgroundText,
                  backgroundColor: colors.ui.card.background,
                  marginBottom: spacing.sm,
                  height: 100,
                },
              ]}
              placeholder="Description"
              placeholderTextColor={colors.backgroundTextSoft}
              multiline
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.backgroundText,
                  backgroundColor: colors.ui.card.background,
                  marginBottom: spacing.sm,
                },
              ]}
              placeholder="Prix"
              placeholderTextColor={colors.backgroundTextSoft}
              keyboardType="numeric"
              value={newItem.price.toString()}
              onChangeText={(text) => setNewItem({ ...newItem, price: parseFloat(text) || 0 })}
            />

            <TouchableOpacity
              style={[
                styles.imagePicker,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.ui.card.background,
                  marginBottom: spacing.sm,
                },
              ]}
              onPress={handleSelectImage}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={[styles.previewImage, { borderRadius: borderRadius.small }]}
                />
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color={colors.backgroundTextSoft}
                    style={styles.imagePickerIcon}
                  />
                  <Text style={[styles.imagePickerText, { color: colors.backgroundTextSoft }]}>
                    Sélectionner une image
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Boutons de validation */}
            <View style={[styles.modalButtons, { marginTop: spacing.sm }]}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.ui.button.secondary,
                    borderRadius: borderRadius.medium,
                    marginRight: spacing.sm,
                  },
                ]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.ui.button.secondaryText }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.ui.button.primary,
                    borderRadius: borderRadius.medium,
                    opacity: isUploading ? 0.7 : 1,
                  },
                ]}
                onPress={handleAddItem}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.ui.button.primaryText} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.ui.button.primaryText }]}>
                    Publier
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  gridImage: {
    width: '100%',
    height: ITEM_WIDTH,
  },
  gridDetails: {
    padding: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSeller: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  imagePicker: {
    borderWidth: 1,
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePickerContent: {
    alignItems: 'center',
  },
  imagePickerIcon: {
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MarketplaceScreen;