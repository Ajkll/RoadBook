import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MyRoutes() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            {[ 
                { date: '23-03-25', distance: '13km', duration: '1h32' }, 
                { date: '28-03-25', distance: '9km', duration: '1h12' } 
            ].map((route, index) => (
                <View key={index} style={styles.roadCard}>
                    <MaterialIcons name="person" size={40} color="#D9D9D9" />
                    <Text style={styles.text}>{route.date}</Text>
                    <Text style={styles.text}>{route.distance}</Text>
                    <Text style={styles.text}>{route.duration}</Text>
                    <MaterialIcons name="arrow-forward-ios" size={24} color={colors.icon} />
                </View>
            ))}
        </View>
    );
};

const createStyles = (colors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            backgroundColor: colors.background, 
            paddingTop: 20,
        },
        text: {
            fontSize: 16,
            color: colors.text, 
        },
        roadCard: {
            backgroundColor: colors.card, 
            width: width * 0.9,
            height: 100,
            borderRadius: 10,
            paddingHorizontal: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            marginBottom: 20,
        },
    })