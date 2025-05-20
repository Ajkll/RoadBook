import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { User } from '../../types/auth.types';
import { MaterialIcons } from '@expo/vector-icons';

interface ProfileInformationProps {
  user: User;
  editing: boolean;
  editedUser: Partial<User>;
  setEditedUser: (user: Partial<User>) => void;
  setEditing: (editing: boolean) => void;
  handleSaveProfile: () => Promise<void>;
  formatDate: (dateString: string) => string;
}

export default function ProfileInformation({
  user,
  editing,
  editedUser,
  setEditedUser,
  setEditing,
  handleSaveProfile,
  formatDate
}: ProfileInformationProps) {
  const [savingChanges, setSavingChanges] = useState(false);
  const [fieldChanges, setFieldChanges] = useState<Record<string, boolean>>({});

  // Fonction pour sauvegarder un champ individuel
  const saveField = async (fieldName: string, value: any) => {
    try {
      setSavingChanges(true);
      setFieldChanges(prev => ({ ...prev, [fieldName]: true }));

      // Construire un objet avec seulement le champ modifié
      const updateData = {
        [fieldName]: value
      };

      // Appeler la fonction de sauvegarde du profil
      await handleSaveProfile();
      
      // Si tout va bien, mettre à jour le champ dans notre état local
      setEditedUser(prev => ({ ...prev, [fieldName]: value }));
      
      // Afficher un message de succès
      Alert.alert("Mise à jour réussie", `Le champ "${fieldName}" a été mis à jour avec succès.`);
    } catch (error) {
      Alert.alert(
        "Erreur de mise à jour",
        error.message || `Une erreur est survenue lors de la mise à jour du champ "${fieldName}".`
      );
    } finally {
      setSavingChanges(false);
      setFieldChanges(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Fonction pour vérifier si un champ a été modifié
  const isFieldChanged = (fieldName: string): boolean => {
    if (!editedUser || !user) return false;
    return editedUser[fieldName] !== user[fieldName];
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Section photo de profil */}
      <View style={styles.profileImageSection}>
        <Image 
          source={{ uri: user.profilePicture || 'https://via.placeholder.com/150' }} 
          style={styles.profileImage} 
        />
        <TouchableOpacity style={styles.changePhotoButton}>
          <Text style={styles.changePhotoText}>Changer la photo</Text>
        </TouchableOpacity>
      </View>

      {!editing ? (
        /* Mode Lecture avec boutons de modification individuels */
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom d'affichage:</Text>
            <Text style={styles.infoValue}>{user.displayName}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prénom:</Text>
            <Text style={styles.infoValue}>{user.firstName || '-'}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom:</Text>
            <Text style={styles.infoValue}>{user.lastName || '-'}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone:</Text>
            <Text style={styles.infoValue}>{user.phoneNumber || '-'}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de naissance:</Text>
            <Text style={styles.infoValue}>{user.birthDate ? formatDate(user.birthDate) : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Adresse:</Text>
            <Text style={styles.infoValue}>{user.address || '-'}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rôle:</Text>
            <Text style={styles.infoValue}>{user.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio:</Text>
            <Text style={styles.infoValue}>{user.bio || '-'}</Text>
            <TouchableOpacity 
              style={styles.editFieldButton}
              onPress={() => {
                setEditedUser({...user});
                setEditing(true);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#7CA7D8" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membre depuis:</Text>
            <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.editButton]} 
            onPress={() => {
              setEditedUser({...user});
              setEditing(true);
            }}
          >
            <Text style={styles.buttonText}>Modifier tout mon profil</Text>
          </TouchableOpacity>
        </>
      ) : (
        /* Mode Edition avec bouton de sauvegarde */
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom d'affichage:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, isFieldChanged('displayName') && styles.changedInput]}
                value={editedUser.displayName}
                onChangeText={(text) => setEditedUser({...editedUser, displayName: text})}
                placeholder="Nom d'affichage"
              />
              {isFieldChanged('displayName') && (
                <TouchableOpacity 
                  style={styles.saveFieldButton}
                  onPress={() => saveField('displayName', editedUser.displayName)}
                  disabled={savingChanges}
                >
                  {fieldChanges['displayName'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Prénom:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, isFieldChanged('firstName') && styles.changedInput]}
                value={editedUser.firstName}
                onChangeText={(text) => setEditedUser({...editedUser, firstName: text})}
                placeholder="Prénom"
              />
              {isFieldChanged('firstName') && (
                <TouchableOpacity 
                  style={styles.saveFieldButton}
                  onPress={() => saveField('firstName', editedUser.firstName)}
                  disabled={savingChanges}
                >
                  {fieldChanges['firstName'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, isFieldChanged('lastName') && styles.changedInput]}
                value={editedUser.lastName}
                onChangeText={(text) => setEditedUser({...editedUser, lastName: text})}
                placeholder="Nom"
              />
              {isFieldChanged('lastName') && (
                <TouchableOpacity 
                  style={styles.saveFieldButton}
                  onPress={() => saveField('lastName', editedUser.lastName)}
                  disabled={savingChanges}
                >
                  {fieldChanges['lastName'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, isFieldChanged('email') && styles.changedInput]}
                value={editedUser.email}
                onChangeText={(text) => setEditedUser({...editedUser, email: text})}
                placeholder="Email"
                keyboardType="email-address"
              />
              {isFieldChanged('email') && (
                <TouchableOpacity 
                  style={styles.saveFieldButton}
                  onPress={() => saveField('email', editedUser.email)}
                  disabled={savingChanges}
                >
                  {fieldChanges['email'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Téléphone:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, isFieldChanged('phoneNumber') && styles.changedInput]}
                value={editedUser.phoneNumber}
                onChangeText={(text) => setEditedUser({...editedUser, phoneNumber: text})}
                placeholder="Téléphone"
                keyboardType="phone-pad"
              />
              {isFieldChanged('phoneNumber') && (
                <TouchableOpacity 
                  style={styles.saveFieldButton}
                  onPress={() => saveField('phoneNumber', editedUser.phoneNumber)}
                  disabled={savingChanges}
                >
                  {fieldChanges['phoneNumber'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Adresse:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, isFieldChanged('address') && styles.changedInput]}
                value={editedUser.address}
                onChangeText={(text) => setEditedUser({...editedUser, address: text})}
                placeholder="Adresse"
                multiline
              />
              {isFieldChanged('address') && (
                <TouchableOpacity 
                  style={styles.saveFieldButton}
                  onPress={() => saveField('address', editedUser.address)}
                  disabled={savingChanges}
                >
                  {fieldChanges['address'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio:</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, styles.bioInput, isFieldChanged('bio') && styles.changedInput]}
                value={editedUser.bio}
                onChangeText={(text) => setEditedUser({...editedUser, bio: text})}
                placeholder="Parlez-nous de vous..."
                multiline
                numberOfLines={4}
              />
              {isFieldChanged('bio') && (
                <TouchableOpacity 
                  style={[styles.saveFieldButton, { top: 10 }]}
                  onPress={() => saveField('bio', editedUser.bio)}
                  disabled={savingChanges}
                >
                  {fieldChanges['bio'] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => {
                setEditedUser({...user});
                setEditing(false);
              }}
              disabled={savingChanges}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, savingChanges && styles.disabledButton]} 
              onPress={async () => {
                setSavingChanges(true);
                try {
                  await handleSaveProfile();
                  setEditing(false);
                } catch (error) {
                  // Erreur déjà gérée dans handleSaveProfile
                  console.error(error);
                } finally {
                  setSavingChanges(false);
                }
              }}
              disabled={savingChanges}
            >
              {savingChanges ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enregistrer tout</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: '#7CA7D8',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  changePhotoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  infoLabel: {
    width: 130,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  editFieldButton: {
    padding: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    fontWeight: '500',
    color: '#666',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1,
  },
  changedInput: {
    borderColor: '#7CA7D8',
    backgroundColor: '#F0F8FF',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveFieldButton: {
    backgroundColor: '#7CA7D8',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#7CA7D8',
  },
  saveButton: {
    backgroundColor: '#7CA7D8',
    flex: 1,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});