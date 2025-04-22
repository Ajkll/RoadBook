import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme, ThemeColors } from '../../constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AddRouteForm from '../../components/ui/addRoadForm';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { db } from '../../services/firebase/firebaseConfig';
import { getDocs, collection } from 'firebase/firestore';

const { width } = Dimensions.get('window');

type RoadTypes = {
  id: string;
  date: Date;
  distance: number;
  duration: number;
};

export default function MyRoutes() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const currentPath = usePathname();
  const [modalVisible, setModalVisible] = useState(false);
  const [roads, setRoads] = useState<RoadTypes[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSwipe = ({ nativeEvent }) => {
    if (nativeEvent.translationX < -50 && currentPath.includes('stats')) {
      router.push('/(tabs)/my-routes/my-roads');
    } else if (nativeEvent.translationX > 50 && currentPath.includes('my-roads')) {
      router.push('/(tabs)/my-routes/stats');
    }
  };

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const snap = await getDocs(collection(db, 'roads'));
        const data = snap.docs.map((doc) => {
          const rawData = doc.data();

          return {
            id: doc.id,
            date: rawData.date.toDate(),
            distance: rawData.distance,
            duration: rawData.duration,
          };
        });
        setRoads(data);
      } finally {
        setLoading(false);
      }
    };
    fetchRoads();
  }, []);

  if (loading) {
    return <Text>Chargement…</Text>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handleSwipe}>
        <View style={styles.container}>
          <View style={styles.cardsContainer}>
            {roads.map((route, index) => (
              <ExpandableCard key={index} route={route} colors={colors} />
            ))}
          </View>

          <AddRouteForm
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSave={() => setModalVisible(false)}
          />

          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="add-box" size={40} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.printButton}>
            <Ionicons name="print-outline" size={40} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const ExpandableCard = ({ route, colors }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useMemo(() => new Animated.Value(100), []);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggleExpand = () => {
    Animated.timing(animation, {
      toValue: expanded ? 100 : 500,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <Animated.View
      style={[expanded ? styles.expandedCard : styles.roadCard, { height: animation }]}
    >
      {!expanded && (
        <View style={styles.cardContent}>
          <MaterialIcons name="person" size={40} color="#D9D9D9" />
          <Text style={styles.text}>
            {route.date.toLocaleDateString('fr-FR', {
              year: '2-digit',
              month: 'numeric',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.text}>{route.distance} km</Text>
          <Text style={styles.text}>{route.duration} min</Text>

          <TouchableOpacity onPress={toggleExpand}>
            <Animated.View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
              <MaterialIcons name="arrow-forward-ios" size={24} color={colors.primaryIcon} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}

      {expanded && (
        <View>
          <View style={styles.cardContent}>
            <View style={styles.profile}>
              <MaterialIcons name="circle" size={100} color={colors.primaryIcon} />
              <View style={styles.profileName}>
                <Text style={styles.text}>Moniteur*</Text>
                <MaterialIcons name="person" size={30} color={colors.primaryIcon} />
              </View>
            </View>

            <View style={styles.WeatherCard}>
              <Ionicons
                name="thermometer"
                size={24}
                color={colors.primaryIcon}
                style={styles.roadDataWarper}
              />
              <MaterialIcons
                name="air"
                size={24}
                color={colors.primaryIcon}
                style={styles.roadDataWarper}
              />
              <Ionicons
                name="cloud"
                size={24}
                color={colors.primaryIcon}
                style={styles.roadDataWarper}
              />
              <Ionicons
                name="eye"
                size={24}
                color={colors.primaryIcon}
                style={styles.roadDataWarper}
              />
            </View>
          </View>

          <View style={styles.roadData}>
            <Text style={[styles.text, styles.roadDataWarper]}>Trajet 1*</Text>
            <Text style={[styles.text, styles.roadDataWarper]}>
              {route.date.toLocaleDateString('fr-FR', {
                year: '2-digit',
                month: 'numeric',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.text, styles.roadDataWarper]}>{route.distance} km</Text>
            <Text style={[styles.text, styles.roadDataWarper]}>{route.duration} min</Text>
          </View>

          <View style={styles.commentContainer}>
            <View style={styles.roadComment}></View>
            <View style={styles.roadComment}></View>
          </View>

          <TouchableOpacity onPress={toggleExpand} style={styles.closeIcon}>
            <Animated.View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
              <MaterialIcons name="arrow-forward-ios" size={24} color={colors.primaryIcon} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingTop: 20,
    },
    cardsContainer: {
      alignItems: 'center',
    },
    roadCard: {
      backgroundColor: colors.primary,
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
    expandedCard: {
      backgroundColor: colors.primary,
      width: width * 0.9,
      borderRadius: 10,
      paddingHorizontal: 15,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 7,
      marginBottom: 20,
    },
    text: {
      fontSize: 16,
      color: colors.primaryText,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primaryText,
      marginBottom: 5,
    },
    detail: {
      fontSize: 14,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    expandedContent: {
      justifyContent: 'space-between',
    },
    addButton: {
      position: 'absolute',
      bottom: 100,
      left: 45,
    },
    printButton: {
      position: 'absolute',
      bottom: 100,
      right: 45,
    },

    profile: {
      position: 'relative',
      alignItems: 'center',
      width: '40%',
      marginTop: -40,
    },
    profileName: {
      position: 'absolute',
      bottom: -20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 10,
      paddingRight: 10,
      height: 40,
      backgroundColor: colors.primaryDarker,
      borderRadius: 20,
    },
    WeatherCard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '45%',
      height: 120,
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      marginTop: 20,
      marginBottom: 20,
      marginRight: 35,
      paddingTop: 10,
    },
    roadData: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.primaryDarker,
      height: 125,
      borderRadius: 10,
      paddingTop: 20,
      paddingBottom: 20,
    },
    roadDataWarper: {
      display: 'flex',
      width: '50%',
      height: '50%',
      justifyContent: 'center',
      textAlign: 'left',
      marginVertical: 5,
      paddingLeft: 25,
    },
    closeIcon: {
      position: 'absolute',
      right: 0,
      top: 40,
    },
    commentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    roadComment: {
      backgroundColor: colors.primaryDarker,
      width: '47%',
      borderRadius: 10,
      height: 170,
      marginTop: 20,
    },
  });
