import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase/firebaseConfig';

import { getDocsFromCommunity } from './services/firebase/commu';
import { RouteProp } from '@react-navigation/native';

type ProfileScreenRouteParams = {
  pseudo: string;
  bio?: string;
  pdp?: string;
  backgroundImage?: string;
  followers?: number;
};

const ProfileScreen = () => {
  const route = useRoute<RouteProp<{ params: ProfileScreenRouteParams }, 'params'>>();
  const navigation = useNavigation();
  const pseudo = route.params?.pseudo ?? 'Utilisateur inconnu';
  const bio = route.params?.bio ?? 'bio inconnue';
  const pdp = route.params?.pdp ?? '';
  const imageFondUri = route.params?.backgroundImage ?? '';
  const initialFollowers = route.params?.followers ?? 0; // ✅ D’abord ici

  const [followersCount, setFollowersCount] = useState<number>(initialFollowers); // ✅ Ensuite ici
  const [userPublications, setUserPublications] = useState<PublicationProps[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const fetchFollowers = async () => {
    try {
      const userRef = doc(db, 'community', pseudo);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFollowersCount(data.followers ?? 0);
      }
    } catch (error) {
      console.error('Erreur de chargement des followers :', error);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const userRef = doc(db, 'community', pseudo);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const followersList = data.followersList || [];

        if (followersList.includes(currentUserPseudo)) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du follow :', error);
    }
  };

  const currentUserPseudo = 'me';

  useEffect(() => {
    fetchFollowers();
    fetchUserPublications();
    checkIfFollowing();
  }, [pseudo]);

  const fetchUserPublications = async () => {
    try {
      const allPublications = await getDocsFromCommunity();
      const filtered = allPublications.filter((pub) => pub.pseudo === pseudo);
      setUserPublications(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement des publications de l’utilisateur :', error);
    }
  };

  const handleFollow = async () => {
    const userRef = doc(db, 'community', pseudo);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const followersList = data.followersList || [];

    const alreadyFollowing = followersList.includes(currentUserPseudo);
    const updatedList = alreadyFollowing
      ? followersList.filter((f) => f !== currentUserPseudo)
      : [...followersList, currentUserPseudo];
    const incrementValue = alreadyFollowing ? -1 : 1;

    await updateDoc(userRef, {
      followersList: updatedList,
      followers: increment(incrementValue),
    });

    setFollowersCount((prev) => prev + incrementValue);
    setIsFollowing(!alreadyFollowing); // Bien mettre à jour ici
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={{ uri: imageFondUri }} style={styles.backgroundImage} />
        </View>

        {/* Profile */}
        <View style={styles.profile}>
          {pdp ? (
            <Image source={{ uri: pdp }} style={styles.pdp} />
          ) : (
            <Icon name="account-circle" size={80} color="#FFF" />
          )}
          <View>
            <Text style={styles.pseudo}>@{pseudo}</Text>
            <Text style={styles.name}>{pseudo}</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bio_container}>
          <Text style={styles.bio}>{bio}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.stats}>
            <Text style={styles.statsFollowers}>{followersCount}</Text> followers
          </Text>
          <Text style={styles.stats}>
            <Text style={styles.statsPublications}>{userPublications.length}</Text> Publications
          </Text>
        </View>

        {/* Publications */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
            Publications
          </Text>

          {userPublications.map((pub, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#2a2a2a',
                padding: 10,
                marginBottom: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: '#FFF' }}>{pub.texte}</Text>
              {pub.publication && (
                <Image
                  source={{ uri: pub.publication }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Chat Button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() =>
          navigation.navigate('ConversationScreen', {
            contactName: pseudo,
          })
        }
      >
        <Icon name="chat" size={40} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.hommeButton} onPress={() => navigation.navigate('file_actu')}>
        <Icon name="home" size={40} color="#FFF" />
      </TouchableOpacity>

      {/* Follow Button */}
      <TouchableOpacity
        style={[styles.followButton, { backgroundColor: isFollowing ? '#ed4242' : '#3273a8' }]}
        onPress={handleFollow}
      >
        <Text style={styles.followText}>{isFollowing ? 'unfollow' : 'follow'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    height: 300,
    width: '100%',
    backgroundColor: '#333',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.4,
  },
  profile: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#363535',
  },
  pdp: {
    width: 110,
    height: 110,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: '#212121',
    top: -70,
    right: -15,
  },
  pseudo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: -40,
    marginLeft: 10,
  },
  name: {
    fontSize: 18,
    color: '#888',
    marginLeft: 10,
  },
  bio_container: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#363535',
    borderColor: '#FFF',
    marginBottom: 20,
  },
  bio: {
    color: '#FFF',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  stats: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 8,
  },
  statsFollowers: {
    fontWeight: 'bold',
  },
  statsPublications: {
    fontWeight: 'bold',
  },
  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3273a8',
    borderRadius: 50,
    padding: 20,
  },
  followButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 30,
    width: 100,
    backgroundColor: '#3273a8',
  },
  followText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },

  hommeButton: {
    backgroundColor: '#3273a8',
    borderRadius: 50,
    position: 'absolute',
    bottom: 20,
    left: '50%',
    padding: 20,
    transform: [{ translateX: -20 }],
  },
});

export default ProfileScreen;
