import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/theme';
import Card from '../common/Card';
import Button from '../common/Button';
import { Ionicons } from '@expo/vector-icons';

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  currentUser: any;
  onDeleteItem: (itemId: string) => void;
  onBuyItem: (itemId: string) => void;
}

const MarketplaceItemCard: React.FC<MarketplaceItemCardProps> = ({
  item,
  currentUser,
  onDeleteItem,
  onBuyItem
}) => {
  const { colors, borderRadius, spacing } = useTheme();

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Il y a ${diffInDays}j`;
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short'
        });
      }
    }
  };

  const handleBuy = () => {
    if (!item.id) {
      return;
    }
    onBuyItem(item.id);
  };

  const handleDelete = () => {
    if (!item.id) {
      return;
    }
    onDeleteItem(item.id);
  };

  const isOwner = currentUser && (item.sellerId === currentUser.id || item.sellerId === currentUser.uid);
  const canBuy = currentUser && !isOwner && !item.isSold && !item.isDeleted;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={[styles.imageContainer, { borderRadius: borderRadius.small }]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.image, { borderRadius: borderRadius.small }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, {
              backgroundColor: colors.ui.card.background,
              borderRadius: borderRadius.small
            }]}>
              <Ionicons
                name="image-outline"
                size={40}
                color={colors.backgroundTextSoft}
              />
            </View>
          )}

          {item.isSold && (
            <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.statusText}>VENDU</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text
            style={[styles.title, { color: colors.backgroundText }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text style={[styles.price, { color: colors.primary }]}>
            €{item.price.toFixed(2)}
          </Text>

          <View style={styles.sellerContainer}>
            {item.sellerAvatar ? (
              <Image
                source={{ uri: item.sellerAvatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.ui.card.background }]}>
                <Text style={[styles.avatarText, { color: colors.backgroundText }]}>
                  {item.sellerName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.sellerInfo}>
              <Text
                style={[styles.sellerName, { color: colors.backgroundTextSoft }]}
                numberOfLines={1}
              >
                {item.sellerName}
              </Text>
              <Text style={[styles.timeAgo, { color: colors.backgroundTextSoft }]}>
                {getTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {canBuy && (
              <Button
                label="Acheter"
                onPress={handleBuy}
                type="primary"
                small
                style={[styles.button, { flex: 1 }]}
                icon="card-outline"
              />
            )}

            {isOwner && (
              <Button
                label="Supprimer"
                onPress={handleDelete}
                type="danger"
                small
                style={[styles.button, canBuy && { marginLeft: spacing.xs }]}
                icon="trash-outline"
              />
            )}

            {!currentUser && (
              <View style={[styles.loginPrompt, { backgroundColor: colors.ui.card.background }]}>
                <Text style={[styles.loginText, { color: colors.backgroundTextSoft }]}>
                  Connectez-vous pour acheter
                </Text>
              </View>
            )}

            {currentUser && !canBuy && !isOwner && (
              <View style={[styles.unavailableContainer, { backgroundColor: colors.ui.card.background }]}>
                <Text style={[styles.unavailableText, { color: colors.backgroundTextSoft }]}>
                  {item.isSold ? 'Article vendu' : 'Non disponible'}
                </Text>
              </View>
            )}
          </View>
        </View>
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
    flex: 1,
    overflow: 'hidden'
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  details: {
    padding: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 11,
  },
  actionsContainer: {
    marginTop: 8,
  },
  button: {
    marginBottom: 4,
  },
  loginPrompt: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 12,
    textAlign: 'center',
  },
  unavailableContainer: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MarketplaceItemCard;