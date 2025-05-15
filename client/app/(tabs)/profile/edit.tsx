import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { logger } from '../../utils/logger';

/**
 * Écran d'édition du profil utilisateur
 * Permet de modifier les informations personnelles et la photo de profil
 */
export default function EditProfileScreen() {
  const { user, refreshUserData, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour les champs du formulaire
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profilePicture || null);
  
  // Erreurs de validation
  const [errors, setErrors] = useState({});

  // Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
      setProfileImage(user.profilePicture || null);
    }
  }, [user]);

  /**
   * Gère la sélection d'une image depuis la galerie
   */
  const handleImagePick = async () => {
    try {
      // Demander les permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la galerie pour changer votre photo de profil.');
        return;
      }
      
      // Lancer le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        // En production, nous téléchargerions l'image sur le serveur ici
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection d\'image', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image. Veuillez réessayer.');
    }
  };

  /**
   * Valide le formulaire avant soumission
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Le nom d\'utilisateur est requis';
    } else if (displayName.length < 3) {
      newErrors.displayName = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    
    // Autres validations au besoin
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumet le formulaire pour mettre à jour le profil
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // En production, nous enverrions ces données au serveur
      // Pour l'instant, simulons une réussite
      
      setTimeout(() => {
        Alert.alert(
          'Profil mis à jour',
          'Vos informations ont été mises à jour avec succès.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour votre profil. Veuillez réessayer plus tard.'
      );
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.contentContainer}
    >
      {/* Photo de profil */}
      <View style={styles.imageContainer}>
        <TouchableOpacity style={styles.imageWrapper} onPress={handleImagePick}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profilePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={60} color={colors.background} />
            </View>
          )}
          <View style={[styles.cameraIconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={18} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.imageHelperText, { color: colors.secondaryText }]}>
          Touchez la photo pour la modifier
        </Text>
      </View>

      {/* Champs du formulaire */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nom d'utilisateur</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: errors.displayName ? '#ef4444' : colors.border },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nom d'utilisateur"
            placeholderTextColor={colors.secondaryText}
          />
          {errors.displayName && (
            <Text style={styles.errorText}>{errors.displayName}</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Prénom</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
              placeholderTextColor={colors.secondaryText}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom"
              placeholderTextColor={colors.secondaryText}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Téléphone</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Numéro de téléphone"
            placeholderTextColor={colors.secondaryText}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Adresse</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            value={address}
            onChangeText={setAddress}
            placeholder="Adresse postale"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>À propos de moi</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            value={bio}
            onChangeText={setBio}
            placeholder="Quelques mots à propos de vous..."
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.card }]} 
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  imageHelperText: {
    marginTop: 8,
    fontSize: 13,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});