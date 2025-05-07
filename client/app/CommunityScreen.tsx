import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './constants/theme';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from './store/slices/networkSlice';
import OfflineContent from './components/ui/OfflineContent';
import GoBackHomeButton from './components/common/GoBackHomeButton';

interface ContactProps {
  name: string;
  message: string;
  onPress: () => void;
}

const ContactItem: React.FC<ContactProps> = ({ name, message, onPress }) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity style={styles.contact} onPress={onPress}>
      <Icon
        name="account-circle"
        size={theme.typography.header.fontSize * 1.8}
        color={theme.colors.primaryText}
      />
      <View style={styles.textContainer}>
        <Text style={styles.text}>{name}</Text>
        <Text style={styles.dernier_message}>{message}</Text>
      </View>
    </TouchableOpacity>
  );
};

const BlackScreen: React.FC = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation();
  const isConnected = useSelector(selectIsInternetReachable);

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Paiement</Text>
          <OfflineContent message="Impossible de procéder au paiement. Vérifiez votre connexion internet." />
          <GoBackHomeButton
            containerStyle={{
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.xxl,
              alignSelf: 'flex-start'
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }
  const contacts = [
    { name: 'Guillaume', message: 'Bonjour' },
    { name: 'Julien', message: 'On peut se voir quand ?' },
    { name: 'Romain', message: 'désolé je sais pas' },
    { name: 'Jonathan', message: 'Tu es la ?' },
    { name: 'Nathan', message: 'Oui je sais il me l a dis' },
    { name: 'Lucas', message: 'D accord on fait ça' },
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactPress = (contact: {name: string; message: string}) => {
    navigation.navigate('ConversationScreen', {
      contactName: contact.name,
      contactMessage: contact.message,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher..."
        placeholderTextColor={theme.colors.backgroundTextSoft}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView style={styles.scrollView}>
        {filteredContacts.map((contact, index) => (
          <ContactItem
            key={index}
            name={contact.name}
            message={contact.message}
            onPress={() => handleContactPress(contact)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  searchBar: {
    height: 40,
    borderRadius: theme.borderRadius.medium,
    paddingLeft: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    color: theme.colors.backgroundText,
    backgroundColor: theme.colors.secondary,
    ...theme.shadow.sm,
  },
  contact: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  textContainer: {
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    color: theme.colors.backgroundText,
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
  },
  dernier_message: {
    color: theme.colors.backgroundTextSoft,
    fontSize: theme.typography.body.fontSize,
    marginTop: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
});

export default BlackScreen;