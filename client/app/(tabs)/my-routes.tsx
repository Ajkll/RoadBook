import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MyRoutes = () => {
    return (
        <View style={styles.container}>
            <View style={styles.roadCard}>
                <MaterialIcons name="person" size={40} color="#D9D9D9" />
                <Text style={styles.text}>28-03-22</Text>
                <Text style={styles.text}>13km</Text>
                <Text style={styles.text}>1h32</Text>
                <MaterialIcons name="arrow-forward-ios" size={24} color="#D9D9D9" />
            </View>
            <View style={styles.roadCard}>
                <MaterialIcons name="person" size={40} color="#D9D9D9" />
                <Text style={styles.text}>28-03-25</Text>
                <Text style={styles.text}>9km</Text>
                <Text style={styles.text}>1h12</Text>
                <MaterialIcons name="arrow-forward-ios" size={24} color="#D9D9D9" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#5F5F5F',
        paddingTop: 20,
    },
    text: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    roadCard: {
        backgroundColor: '#7CA7D8',
        width: width * 0.9,
        height: 100,
        borderRadius: 10,
        paddingLeft: 15,
        paddingRight: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
    },
});

export default MyRoutes;
