import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Animated, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme, ThemeColors } from '../../constants/theme';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AddRouteForm from '../../components/ui/addRoadForm';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  ScrollView,
} from 'react-native-gesture-handler';
import { sessionApi } from '../../services/api';
import { useRoads } from '../../context/RoadContext';
import { printAllRoutes, printSingleRoute } from '../../services/printService';

const { width } = Dimensions.get('window');

type IconName =
  | "weather-sunny"
  | "weather-cloudy"
  | "weather-pouring"
  | "weather-snowy"
  | "weather-fog"
  | "weather-windy"
  | "weather-partly-cloudy"
  ;

const weatherMap: Record<string, { icon: IconName; label: string }> = {
  CLEAR: { icon: 'weather-sunny', label: 'Ensoleillé' },
  CLOUDY: { icon: 'weather-cloudy', label: 'Nuageux' },
  RAINY: { icon: 'weather-pouring', label: 'Pluvieux' },
  SNOWY: { icon: 'weather-snowy', label: 'Neigeux' },
  FOGGY: { icon: 'weather-fog', label: 'Brumeux' },
  WINDY: { icon: 'weather-windy', label: 'Venteux' },
  OTHER: { icon: 'weather-partly-cloudy', label: 'Autre' },
};

export default function MyRoutes() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const currentPath = usePathname();
  const [modalVisible, setModalVisible] = useState(false);
  const { roads, refreshRoads } = useRoads(); 
  
  const handleHorizontalSwipe = ({ nativeEvent }) => {
    if (nativeEvent.translationX < -50 && currentPath.includes('stats')) {
      router.push('/(tabs)/my-routes/my-roads');
    } else if (nativeEvent.translationX > 50 && currentPath.includes('my-roads')) {
      router.push('/(tabs)/my-routes/stats');
    }
  };

  // Fonction pour imprimer toutes les routes
  const handlePrintAllRoutes = async () => {
    await printAllRoutes(roads);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handleHorizontalSwipe}
        activeOffsetX={[-2, 2]}
        failOffsetY={[-20, 20]}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEventThrottle={5}
          >
            <View style={styles.cardsContainer}>
              {Array.isArray(roads) && roads.length > 0 ? (
                roads.map((route, index) => (
                  <ExpandableCard
                    key={route.id || index}
                    route={route}
                    colors={colors}
                    refreshRoads={refreshRoads}
                  />
                ))
              ) : (
                <Text style={{ color: colors.primaryText }}>Chargement des routes...</Text>
              )}
            </View>

            <View style={{ height: 150 }} />
          </ScrollView>

          <AddRouteForm
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSave={() => setModalVisible(false)}
          />
          <View style={styles.test}>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <MaterialIcons name="post-add" size={40} color={colors.backgroundIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.printButton} onPress={handlePrintAllRoutes}>
              <Ionicons name="print-outline" size={40} color={colors.backgroundIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const ExpandableCard = ({ route, colors, refreshRoads }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useMemo(() => new Animated.Value(110), []);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggleExpand = () => {
    Animated.timing(animation, {
      toValue: expanded ? 110 : 400,
      duration: expanded ? 250 : 250,  
      useNativeDriver: false,
    }).start();

    if (expanded) {
      setExpanded(!expanded);
    } else {
      setTimeout(() => {
        setExpanded(!expanded);
      }, 0);
    }
  };

  // Fonction pour gérer la suppression avec refresh
  const handleDelete = async () => {
    try {
      await sessionApi.deleteSession(route.id);
      console.log("Suppression de la route avec l'id : " + route.id);
      
      // Refresh les données après suppression
      if (refreshRoads) {
        refreshRoads();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Confirmer la suppression",
      "Voulez-vous vraiment supprimer ce trajet ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", onPress: handleDelete, style: "destructive" }
      ]
    );
  };

  // Fonction pour imprimer une route individuelle
  const handlePrintSingleRoute = async () => {
    await printSingleRoute(route);
  };

  return (
    <Animated.View
      style={[expanded ? styles.expandedCard : styles.roadCard, { height: animation }]}
    >
      {!expanded && (
        <View style={styles.cardContent}>
          {/* La petite croix avec gestion async */}
          <TouchableOpacity onPress={confirmDelete}>
            <MaterialIcons name="close" size={30} color={colors.primaryIcon} />
          </TouchableOpacity>

          <MaterialIcons name="person" size={40} color="#D9D9D9" />
          <Text style={styles.text}>
            {new Date(route.date).toLocaleDateString('fr-FR', {
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
                <Text style={styles.text}>Moniteur</Text>
                <MaterialIcons name="person" size={30} color={colors.primaryIcon} />
              </View>
            </View>

            <View style={styles.WeatherCard}>
              <MaterialCommunityIcons
                name={weatherMap[route.weather]?.icon ?? 'weather-partly-cloudy'}
                size={24}
                color={colors.primaryIcon}
                style={styles.roadDataWarper}
              />
              <Text style={styles.text}>
                {weatherMap[route.weather]?.label ?? 'Inconnu'}
              </Text>
            </View>
          </View>

          <View style={styles.roadData}>
            <Text style={[styles.text, styles.roadDataWarper]}>{route.title}</Text>
            <Text style={[styles.text, styles.roadDataWarper]}>
              {new Date(route.date).toLocaleDateString('fr-FR', {
                year: '2-digit',
                month: 'numeric',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.text, styles.roadDataWarper]}>{route.distance} km</Text>
            <Text style={[styles.text, styles.roadDataWarper]}>{route.duration} min</Text>
          </View>

          <View style={styles.roadPoints}>
            <Text style={[styles.text]}>{route.startLocation}</Text>
            <MaterialIcons name="arrow-forward-ios" size={24} color={colors.primaryIcon} />
            <Text style={[styles.text]}>{route.endLocation}</Text>
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
      backgroundColor: colors.background,
      position: 'relative',
    },
    scrollViewContent: {
      paddingTop: 20,
      paddingBottom: 150,
      alignItems: 'center',
    },
    cardsContainer: {
      alignItems: 'center',
      width: '100%',
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
      zIndex: 999,
    },
    printButton: {
      position: 'absolute',
      bottom: 100,
      right: 45,
      zIndex: 999,
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
      flexDirection: 'column',     
      alignItems: 'center',        
      justifyContent: 'center',    
      width: '45%',
      height: 120,
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      marginTop: 20,
      marginBottom: 20,
      marginRight: 35,
      paddingTop: 20,
      paddingBottom: 30,
    },
    roadPoints: {
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      height: 60,
      width: '100%',
      marginBottom: 25,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    roadData: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.primaryDarker,
      height: 125,
      borderRadius: 10,
      paddingTop: 20,
      paddingBottom: 20,
      marginBottom: 20,
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
      width: '100%',
      padding: 10,
      borderRadius: 10,
      marginTop: 20,
    },
    actionButtonsContainer: {
      alignItems: 'center',
      marginTop: 15,
      marginBottom: 10,
    },
    singlePrintButton: {
      alignItems: 'center',
      padding: 10,
      backgroundColor: colors.primaryDarker,
      borderRadius: 8,
      minWidth: 80,
    },
    test: {
      height: 0,
    },
  });