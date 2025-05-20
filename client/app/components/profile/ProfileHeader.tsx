import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { User } from '../../types/auth.types';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProfileHeaderProps {
  user: User;
  updateProfilePicture?: (uri: string) => Promise<void>;
}

export default function ProfileHeader({ user, updateProfilePicture }: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);

  const selectImage = async () => {
    // Vérifier si le updateProfilePicture est disponible
    if (!updateProfilePicture) {
      Alert.alert("Fonctionnalité non disponible", 
                 "La mise à jour de la photo de profil n'est pas disponible pour le moment.");
      return;
    }

    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission requise", "Nous avons besoin de votre permission pour accéder à vos photos.");
        return;
      }

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
          await updateProfilePicture(selectedImage.uri);
          
          // Afficher un message de succès
          Alert.alert("Succès", "Votre photo de profil a été mise à jour avec succès.");
        } catch (error) {
          // Afficher un message d'erreur
          Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la mise à jour de votre photo de profil.");
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la sélection de l'image.");
      console.error(error);
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.profileImageContainer}
        onPress={selectImage}
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
      <Text style={styles.userName}>{user.displayName}</Text>
      <Text style={styles.userRole}>{user.role}</Text>
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
});