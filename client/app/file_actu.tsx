import React, { useEffect, useState } from 'react';
import { Image, View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { getDocsFromCommunity } from './services/firebase/commu';

type PublicationProps = {
  pseudo: string;
  pdp: string;
  bio: string;
  texte: string;
  publication: string;
  backgroundImage: string;
  followers: Number;
};

const Publication: React.FC<PublicationProps> = ({
  pseudo,
  pdp,
  bio,
  publication,
  backgroundImage,
  texte,
  followers,
}) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.publicationContainer}>
      <TouchableOpacity
        style={styles.container_profile}
        onPress={() =>
          navigation.navigate('profile_user', {
            pseudo,
            bio,
            pdp,
            backgroundImage,
            followers,
          })
        }
      >
        {pdp ? (
          <Image source={{ uri: pdp }} style={styles.pdp} />
        ) : (
          <Icon name="account-circle" size={50} color="#FFF" />
        )}
        <Text style={styles.pseudo}>@{pseudo}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.publication}>{texte}</Text>
      </View>

      {publication ? <Image source={{ uri: publication }} style={styles.image} /> : null}
    </View>
  );
};

const FileActu: React.FC = () => {
  const [publications, setPublications] = useState<PublicationProps[]>([]);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const data = await getDocsFromCommunity();
        setPublications(data);
      } catch (error) {
        console.error('Erreur lors du chargement des publications :', error);
      }
    };

    fetchPublications();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {publications.map((publi, index) => (
        <Publication key={index} {...publi} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  publicationContainer: {
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#363535',
    borderRadius: 15,
    margin: 10,
    padding: 5,
  },
  container_profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdp: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  pseudo: {
    fontSize: 18,
    color: '#FFF',
    marginLeft: 10,
  },
  textContainer: {
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
  },
  publication: {
    color: '#FFF',
    marginTop: 10,
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
});

export default FileActu;
