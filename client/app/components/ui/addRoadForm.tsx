import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function AddRouteForm({ visible, onClose, onSave }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    
    return (
        <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        >
        <View style={styles.centeredView}>
            <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Ajouter un trajet</Text>
            
            {/* Champ nom du trajet - pleine largeur */}
            <TextInput 
                style={styles.fullWidthInput} 
                placeholder="Trajet 3"
                placeholderTextColor="#999"
            />
            
            {/* Groupe de champs côte à côte avec indication obligatoire */}
            <View style={styles.groupForm}>
                <View style={styles.inputWithRequired}>
                    <Text style={styles.requiredStar}>*</Text>
                    <TextInput 
                        style={styles.halfWidthInput} 
                        placeholder="Date"
                        placeholderTextColor="#999"
                    />
                </View>
                <TextInput 
                    style={styles.halfWidthInput}
                    placeholder="Meteo"
                    placeholderTextColor="#999"
                />
            </View>
            
            {/* Champs avec ":" en placeholder centrés et reliés */}
            <View style={styles.timeInputContainer}>
                <TextInput 
                    style={styles.timeInput} 
                    placeholder=":" 
                    placeholderTextColor="#999"
                    textAlign="center"
                />
                <View style={styles.timeConnector} />
                <TextInput 
                    style={styles.timeInput} 
                    placeholder=":" 
                    placeholderTextColor="#999"
                    textAlign="center"
                />
            </View>
            
            {/* Champ accompagnant aligné à gauche */}
            <View style={styles.accompagnantContainer}>
                <TextInput 
                    style={styles.halfWidthInput}
                    placeholder="Accompagnant"
                    placeholderTextColor="#999"
                />
            </View>
            
            {/* Autres champs... */}
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={onSave}>
                    <Text style={styles.buttonText}>Ajouter</Text>
                    <MaterialIcons name="add-box" size={30} color={colors.primaryText} />
                </TouchableOpacity>
            </View>
            </View>
        </View>
        </Modal>
    );
}

const createStyles = (colors) =>
    StyleSheet.create({
    // Styles pour le modal
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)' 
    },
    modalView: {
        width: '90%',
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: colors.primaryText
    },
    fullWidthInput: {
        backgroundColor: colors.secondary,
        borderRadius: 10,
        height: 50,
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 10,
        color: colors.text
    },
    // Input demi-largeur (pour date et météo)
    halfWidthInput: {
        backgroundColor: colors.secondary,
        borderRadius: 10,
        height: 50,
        width: '48%', 
        marginBottom: 15,
        paddingHorizontal: 10,
        color: colors.text
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    // Boutons séparés avec styles spécifiques
    cancelButton: {
        backgroundColor: colors.primaryDarker,
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    addButton: {
        backgroundColor: colors.primaryDarker,
        borderRadius: 10,
        padding: 10,
        paddingLeft: 20,
        paddingRight: 20,
        elevation: 2,
        width: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    buttonText: {
        color: colors.primaryText,
        fontWeight: 'bold',
    },
    groupForm: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    // Container pour le champ avec indicateur obligatoire
    inputWithRequired: {
        width: '48%',
        position: 'relative',
    },
    requiredStar: {
        color: 'red',
        fontSize: 20,
        position: 'absolute',
        left: -10,
        top: -5,
        zIndex: 1,
    },
    timeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    timeInput: {
        backgroundColor: colors.secondary,
        borderRadius: 10,
        height: 50,
        width: '45%',
        paddingHorizontal: 10,
        color: colors.text,
    },
    timeConnector: {
        width: '6%',
        height: 2,
        backgroundColor: colors.primaryIcon,
        marginHorizontal: 5,
    },
    // Conteneur pour aligner Accompagnant à gauche
    accompagnantContainer: {
        width: '100%',
        alignItems: 'flex-start',
    }
});