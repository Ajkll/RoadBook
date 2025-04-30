import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';

const PaymentConfirmation: React.FC = () => {
  const { products = '[]', totalPrice } = useLocalSearchParams();

  let parsedProducts = [];

  try {
    parsedProducts = JSON.parse(products);
  } catch (e) {
    console.warn('Échec du parsing des produits', e);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Icon name="check-circle" size={200} color="white" style={styles.icon} />
        <Text style={styles.text_confirmation}>Votre paiement pour le(s) article(s) suivant a bien été effectué :</Text>

        <View style={styles.achat}>
          <Icon name="shopping-bag" size={100} color="#2596be" style={styles.icon} />

          {/* Affiche chaque produit */}
          <View style={styles.productsList}>
            {parsedProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price.toFixed(2)}€</Text>
              </View>
            ))}
          </View>

          {/* Affiche le total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>{totalPrice}€</Text>
          </View>
        </View>

        <Text style={styles.text}>
          Merci pour votre commande, vous allez recevoir un email reprenant les informations de votre commande.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.buttonText}>Appuyer ici</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#2596be', // Applique la couleur de fond à l'élément parent
  },
  container: {
    flexGrow: 1, // Assure que le ScrollView occupe toute la hauteur disponible
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20, // Assurez-vous qu'il y a un peu d'espace pour scroller
  },
  icon: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  text_confirmation: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 23,
    borderRadius: 10,
    margin : 20,
  },
  buttonText: {
    color: '#2596be',
    fontWeight: 'bold',
    fontSize: 16,
  },
  achat: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 20,
    margin: 30,
  },
  productsList: {
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    color: '#2596be',
    fontWeight: 'bold',
    flex: 1, // Pour laisser de la place à droite pour le prix
  },
  productPrice: {
    color: '#2596be',
    fontWeight: 'bold',
    textAlign: 'right',
    minWidth: 100, // Assure que les prix sont bien alignés
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2596be',
    paddingTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2596be',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2596be',
  },
  
});

export default PaymentConfirmation;
