import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '../../constants/theme';
import { User } from '../../types/auth.types';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from '../../store/slices/networkSlice';
import { logger } from '../../utils/logger';

interface ProfileHeaderProps {
  user: User;
  updateProfilePicture?: (uri: string, source?: 'gallery' | 'camera') => Promise<void>;
}

export default function ProfileHeader({ user, updateProfilePicture }: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const isOnline = useSelector(selectIsInternetReachable);
  const { colors, dark } = useTheme();

  // Ouvrir le modal de sélection de la source de l'image
  const openPhotoOptions = () => {
    // Vérifier si l'utilisateur est en ligne
    if (!isOnline) {
      Alert.alert(
        "Mode hors ligne",
        "La modification de la photo de profil n'est pas disponible en mode hors ligne. Veuillez vous connecter à Internet pour effectuer cette action."
      );
      return;
    }
    
    // Vérifier si la fonction de mise à jour est disponible
    if (!updateProfilePicture) {
      Alert.alert(
        "Fonctionnalité non disponible", 
        "La mise à jour de la photo de profil n'est pas disponible pour le moment."
      );
      return;
    }
    
    setShowPhotoOptions(true);
  };
  
  // Sélectionner une image depuis la galerie
  const selectImageFromGallery = async () => {
    setShowPhotoOptions(false);
    
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission requise", 
          "Nous avons besoin de votre permission pour accéder à vos photos."
        );
        return;
      }
      
      logger.info("Lancement du sélecteur d'images");

      // Lancer le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Afficher un indicateur de chargement
        setUploading(true);

        try {
          // Appeler la fonction de mise à jour de la photo de profil
          await updateProfilePicture(selectedImage.uri, 'gallery');
          
          // Afficher un message de succès
          Alert.alert("Succès", "Votre photo de profil a été mise à jour avec succès.");
        } catch (error) {
          if (error.message !== 'Hors ligne') {
            // Afficher un message d'erreur seulement si ce n'est pas déjà une erreur de mode hors ligne
            Alert.alert(
              "Erreur", 
              error.message || "Une erreur est survenue lors de la mise à jour de votre photo de profil."
            );
          }
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la sélection de l'image depuis la galerie:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la sélection de l'image.");
    }
  };
  
  // Prendre une photo avec la caméra
  const takePhoto = async () => {
    setShowPhotoOptions(false);
    
    try {
      // Demander la permission d'accéder à la caméra
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          "Permission requise", 
          "Nous avons besoin de votre permission pour accéder à votre caméra."
        );
        return;
      }
      
      logger.info("Lancement de la caméra");
      
      // Lancer la caméra
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = result.assets[0];
        
        // Afficher un indicateur de chargement
        setUploading(true);
        
        try {
          // Appeler la fonction de mise à jour de la photo de profil
          await updateProfilePicture(photo.uri, 'camera');
          
          // Afficher un message de succès
          Alert.alert("Succès", "Votre photo de profil a été mise à jour avec succès.");
        } catch (error) {
          if (error.message !== 'Hors ligne') {
            // Afficher un message d'erreur seulement si ce n'est pas déjà une erreur de mode hors ligne
            Alert.alert(
              "Erreur", 
              error.message || "Une erreur est survenue lors de la mise à jour de votre photo de profil."
            );
          }
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la prise de photo:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la prise de photo.");
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.profileImageContainer}
        onPress={openPhotoOptions}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="large" color="#7CA7D8" />
        ) : user.profilePicture ? (
          <>
            <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>
          </>
        ) : (
          <>
            <View style={styles.profileInitials}>
              <Text style={styles.initialsText}>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>
          </>
        )}
      </TouchableOpacity>
      <Text style={[styles.userName, { color: colors.backgroundText }]}>{user.displayName}</Text>
      <Text style={[styles.userRole, { color: colors.backgroundTextSoft }]}>{user.role}</Text>
      
      {/* Modal pour choisir la source de la photo */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPhotoOptions(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.ui.modal.background }]}>
            <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>Modifier votre photo de profil</Text>
            
            <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#7CA7D8" />
              <Text style={[styles.optionText, { color: colors.backgroundText }]}>Prendre une photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={selectImageFromGallery}>
              <Ionicons name="images" size={24} color="#7CA7D8" />
              <Text style={[styles.optionText, { color: colors.backgroundText }]}>Choisir depuis la galerie</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={[styles.cancelText, { color: colors.backgroundTextSoft }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7CA7D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
});