import React, { useMemo } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from '../../constants/theme';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';

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
            
            <TextInput 
                style={styles.fullWidthInput} 
                placeholder="Trajet 3"
                placeholderTextColor="#999"
            />
            
            <View style={styles.groupForm}>
                <TouchableOpacity style={styles.halfWidthInput}>
                    <Text style={styles.requiredStar}>*</Text>
                    <Text style={styles.text}>Date</Text>
                    <View style={styles.iconContairner}>
                        <Ionicons name="calendar-outline" size={30} color={colors.secondaryIcon} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.halfWidthInput}>
                    <Text style={styles.text}>Météo</Text>
                    <View style={styles.iconContairner}>
                        <MaterialCommunityIcons name="weather-snowy-rainy" size={30} color={colors.secondaryIcon} />
                    </View>
                </TouchableOpacity>
            </View>
            
            <View style={styles.accompagnantContainer}>
                <TouchableOpacity style={styles.halfWidthInput}>
                    <Text style={styles.text}>Accompagnant</Text>
                    <View style={styles.iconContairner}>
                        <MaterialIcons name="person" size={30} color={colors.secondaryIcon} />                        
                    </View>
                </TouchableOpacity>
            </View>

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

const createStyles = (colors: ThemeColors) =>
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
        height: 55,
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 10,
        color: colors.primaryText
    },
    // Input demi-largeur (pour date et météo)
    halfWidthInput: {
        backgroundColor: colors.secondary,
        borderRadius: 10,
        height: 55,
        width: '48%', 
        marginBottom: 15,
        paddingHorizontal: 25, 
        color: colors.primaryText,
        alignItems: 'center', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
    },
    
    text: {
        color: colors.secondaryText,
        fontSize: 14,
        marginLeft: 10,
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
    requiredStar: {
        color: colors.red,
        fontSize: 25,
        position: 'absolute',
        left: "3%",
        top: "19%",
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
        height: 55,
        width: '45%',
        paddingHorizontal: 10,
        color: colors.primaryText,
    },
    timeConnector: {
        width: '6%',
        height: 2,
        backgroundColor: colors.primaryIcon,
        marginHorizontal: 5,
    },
    // Conteneur pour aligner Accompagnant à gauche
    accompagnantContainer: {
        width: '130%',
        alignItems: 'center',
    },
    iconContairner: {
        backgroundColor: colors.secondaryDark,
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});