import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView, TextInput } from 'react-native-gesture-handler';

const ConversationScreen: React.FC = () => {
  const route = useRoute();
  const { contactName = 'Nom inconnu', contactMessages = [] } = route.params || {};
  const [messageTexte, setMessageTexte] = useState('');
  const [messages, setMessages] = useState(contactMessages); // la liste de tout les message, fct pour modifier la liste

  const envoyerMessage = () => {
    setMessages([...messages, messageTexte]);
    setMessageTexte('');
  };

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Icon name="account-circle" size={40} color="#FFF" />
        <Text style={styles.nom_contact}>{contactName}</Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View key={index} style={styles.messageContainer}>
            <Text style={styles.message}>{message}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Zone pour écrire le message */}
      <View style={styles.envoie_message}>
        <TextInput
          style={styles.input}
          placeholder="écris ici"
          value={messageTexte}
          onChangeText={setMessageTexte}
        />

        <TouchableOpacity onPress={() => envoyerMessage()} style={styles.iconContainer}>
          <Icon name="send" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>
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
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 10,
  },

  message: {
    color: 'white',
    backgroundColor: '#236c82',
    padding: 15,
    borderRadius: 15,
    width: 200,
  },

  messagesContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  messageContainer: {
    marginBottom: 15,
  },

  input: {
    flex: 1, // Cette ligne permet au champ texte de prendre tout l'espace disponible
    borderRadius: 15,
    paddingLeft: 10,
    marginHorizontal: 10,
    color: 'black',
    backgroundColor: '#FFF',
  },

  envoie_message: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, // Ajout de padding pour donner de l'espace autour des éléments...
    paddingVertical: 20, // Ajout de padding vertical pour améliorer la disposition...
  },

  iconContainer: {
    backgroundColor: '#424242',
    padding: 10,
    borderRadius: 15,
  },
});

export default ConversationScreen;
