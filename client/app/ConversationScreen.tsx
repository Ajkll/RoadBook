import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from './constants/theme';

const ConversationScreen: React.FC = () => {
    const theme = useTheme();
    const styles = makeStyles(theme);

    const route = useRoute();
    const { contactName, contactMessage } = route.params;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Icon
                    name="account-circle"
                    size={theme.typography.header.fontSize * 1.5}
                    color={theme.colors.primaryText}
                />
                <Text style={styles.nom_contact}>{contactName}</Text>
            </View>

            <Text style={styles.message}>{contactMessage}</Text>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadow.sm,
    },
    nom_contact: {
        color: theme.colors.primaryText,
        fontSize: theme.typography.header.fontSize,
        fontWeight: theme.typography.header.fontWeight,
        textAlign: 'left',
        marginLeft: theme.spacing.md,
    },
    message: {
        color: theme.colors.primaryText,
        backgroundColor: theme.colors.primaryDark,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.large,
        margin: theme.spacing.md,
        alignSelf: 'flex-start',
        maxWidth: '70%',
    }
});

export default ConversationScreen;