    import React from 'react';
    import { View, Text, StyleSheet } from 'react-native';
    import { useRoute } from '@react-navigation/native';
    import Icon from 'react-native-vector-icons/MaterialIcons';

    const ConversationScreen: React.FC = () => {
        const route = useRoute();
        const { contactName, contactMessage } = route.params;


        return (
            <View style={styles.container}>
                {/* header */}
                <View style ={styles.header}>
                    <Icon name="account-circle" size={40} color="#FFF" />
                    <Text style={styles.nom_contact}>{contactName}</Text>
                </View>
                
                <Text style={styles.message}>{contactMessage}</Text>
            </View>
        );
    };

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212121',
    },

    header: {
        backgroundColor: '#37474F',
        paddingVertical: 20,
        paddingHorizontal: 30,
        flexDirection: 'row',
        alignItems: 'center',   
    },

    nom_contact: {
        color: 'white',
        fontSize: 28,
        fontWeight : 'bold',
        textAlign: 'left',
        marginLeft : 10,
    },

    message : {
        color : 'white',
        backgroundColor : '#236c82',
        padding : 15,
        borderRadius : 15,
        width : 200,
    }

    });

    export default ConversationScreen;


{/* commentaire pour push */}