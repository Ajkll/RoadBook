import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Touchable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native'; // Importation du hook de navigation
import 'react-native-gesture-handler';

interface ContactProps {
  name: string;
  message: string;
  onPress: () => void;
}

const ContactItem: React.FC<ContactProps> = ({ name, message, onPress }) => (
  <TouchableOpacity style={styles.contact} onPress={onPress}>
    <Icon name="account-circle" size={50} color="#FFF" />
    <View style={styles.textContainer}>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.dernier_message}>{message}</Text>
    </View>
  </TouchableOpacity>
);

const BlackScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>(''); // État pour le texte de recherche
  const navigation = useNavigation(); // Hook pour la navigation

  const contacts = [
    { name: 'Guillaume', messages: ['Bonjour', 'Comment ça va ?', 'À bientôt !'] },
    { name: 'Julien', messages: ['On peut se voir quand ?', 'Tu es dispo demain ?'] },
    { name: 'Romain', messages: ['Désolé je sais pas', 'Peut-être la semaine prochaine'] },
    { name: 'Jonathan', messages: ['Tu es là ?', 'On se rejoint à 14h ?'] },
    { name: 'Nathan', messages: ['Oui je sais, il me l’a dit', 'D’accord'] },
    { name: 'Lucas', messages: ['D’accord, on fait ça', 'Ça marche, on se voit à 16h.'] },
  ];

  // Filtrage des contacts selon le texte de recherche
  const filteredContacts = contacts.filter(
    (contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()) // Recherche par nom
  );

  // Fonction pour gérer le clic sur un contact
  const handleContactPress = (contact: { name: string; messages: string[] }) => {
    navigation.navigate('ConversationScreen', {
      contactName: contact.name,
      contactMessages: contact.messages,
    });
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher..."
        value={searchQuery}
        onChangeText={setSearchQuery} // Met à jour la recherche
      />

      {/* Liste des contacts filtrée */}
      <ScrollView style={{ flex: 1 }}>
        {filteredContacts.map((contact, index) => (
          <ContactItem
            key={index}
            name={contact.name}
            message={contact.messages[contact.messages.length - 1]}
            onPress={() => handleContactPress(contact)} // Passer le contact sélectionné à la fonction
          />
        ))}
      </ScrollView>

      {/* ajout d'un second bouton */}
      <TouchableOpacity
        style={styles.file_actu_boutton}
        onPress={() => navigation.navigate('file_actu')}
      >
        <Text style={styles.file_actu}>Fil actualité</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  searchBar: {
    height: 40,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
    color: 'white',
    backgroundColor: '#303030',
  },
  contact: {
    flexDirection: 'row',
    marginTop: 15,
  },
  textContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
  dernier_message: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  file_actu_boutton: {
    backgroundColor: 'red',
    padding: 10,
    width: 100,
    borderRadius: 10,
  },

  file_actu: {
    color: 'white',
    textAlign: 'center',
  },
});

export default BlackScreen;
