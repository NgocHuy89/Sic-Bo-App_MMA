import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

const GAMES = [
  { id: '1', title: 'TÀI XỈU', subtitle: 'SIC BO CLASSIC', color: '#8B0000', icon: '🎲' },
  { id: '2', title: 'BẦU CUA', subtitle: 'TÔM CÁ', color: '#D2691E', icon: '🦀' },
  { id: '3', title: 'ROULETTE', subtitle: 'VÒNG QUAY MAY MẮN', color: '#006400', icon: '🎡' },
  { id: '4', title: 'POKER', subtitle: 'TEXAS HOLDEM', color: '#4B0082', icon: '🃏' },
];

export default function HomeScreen() {
  const renderGameCard = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: item.color }]}>
      <View style={styles.cardContent}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.playButton}>
          <Text style={styles.playButtonText}>CHƠI NGAY</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, Người chơi!</Text>
        <Text style={styles.balance}>Số dư: <Text style={styles.balanceAmount}>10,000,000 đ</Text></Text>
      </View>

      <Text style={styles.sectionTitle}>CÁC TRÒ CHƠI HẤP DẪN</Text>
      
      <FlatList
        data={GAMES}
        keyExtractor={item => item.id}
        renderItem={renderGameCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0505',
  },
  header: {
    padding: 20,
    backgroundColor: '#350A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    marginBottom: 10,
  },
  greeting: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 5,
  },
  balance: {
    color: '#D4AF37',
    fontSize: 16,
  },
  balanceAmount: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  sectionTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 15,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  cardIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  cardSubtitle: {
    color: '#F9E596',
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 2,
  },
  playButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  playButtonText: {
    color: '#1E0505',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
