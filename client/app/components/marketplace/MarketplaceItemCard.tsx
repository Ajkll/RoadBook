import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/theme';
import Card from '../common/Card';
import Button from '../common/Button';
import { router } from 'expo-router';

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  currentUser: any;
  onDeleteItem: (itemId: string) => void;
}

const MarketplaceItemCard: React.FC<MarketplaceItemCardProps> = ({
  item,
  currentUser,
  onDeleteItem
}) => {
  const { colors, borderRadius } = useTheme();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={[styles.image, { borderRadius: borderRadius.small }]}
          resizeMode="cover"
        />

        <View style={styles.details}>
          <Text
            style={[styles.title, { color: colors.backgroundText }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <Text style={[styles.price, { color: colors.ui.button.primary }]}>
            {item.price.toFixed(2)}€
          </Text>

          <View style={styles.sellerContainer}>
            {item.sellerAvatar ? (
              <Image
                source={{ uri: item.sellerAvatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.ui.card.background }]}>
                <Text style={{ color: colors.backgroundText }}>
                  {item.sellerName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text
              style={[styles.sellerName, { color: colors.backgroundTextSoft }]}
              numberOfLines={1}
            >
              {item.sellerName}
            </Text>
          </View>
        </View>

        {currentUser && item.sellerId !== currentUser.id && !item.isSold && (
          <Button
            label="Acheter"
            onPress={() => router.push({
              pathname: '/PaymentScreen',
              params: {
                product: JSON.stringify(item),
                sellerId: item.sellerId
              }
            })}
            small
            style={styles.button}
          />
        )}

        {currentUser && item.sellerId === currentUser.id && (
          <Button
            label="Supprimer"
            onPress={() => onDeleteItem(item.id)}
            type="danger"
            small
            style={styles.button}
          />
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 12
  },
  card: {
    flex: 1
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8
  },
  details: {
    padding: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sellerName: {
    fontSize: 12,
    flex: 1
  },
  button: {
    marginTop: 8
  }
});

export default MarketplaceItemCard;