import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Sic Bo Game
import SicBoModal from '../games/SicBo/SicBoModal';

const GAMES = [
  { id: '1', title: 'TÀI XỈU', subtitle: 'SIC BO CLASSIC', color: '#8B0000', icon: '🎲' },
  { id: '2', title: 'BẦU CUA', subtitle: 'TÔM CÁ', color: '#D2691E', icon: '🦀' },
  { id: '3', title: 'ROULETTE', subtitle: 'VÒNG QUAY MAY MẮN', color: '#006400', icon: '🎡' },
  { id: '4', title: 'POKER', subtitle: 'TEXAS HOLDEM', color: '#4B0082', icon: '🃏' },
];

export default function HomeScreen({ navigation, route }) {
  const user = route?.params?.user || null;
  const initialBalance = user ? user.balance : 0;
  const fullName = user ? user.full_name : 'Người chơi Vô danh';

  const [balance, setBalance] = useState(initialBalance);
  
  // States for Sic Bo Game
  const [isSicBoVisible, setIsSicBoVisible] = useState(false);

  // States for Global Game Loop
  const [timeLeft, setTimeLeft] = useState(60);
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'RESULT'

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('logged_in_user');
      // Dùng navigate để tự động bubble up lên Stack chứa Login
      navigation.navigate('Login');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (gamePhase === 'BETTING') {
            setGamePhase('RESULT');
            return 5; // 5 giây xem kết quả
          } else {
            setGamePhase('BETTING');
            return 60; // 60 giây đặt cược mới
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gamePhase]);

  const handlePlayGame = (gameId) => {
    if (gameId === '1') {
      setIsSicBoVisible(true);
    } else {
      Alert.alert("Thông báo", "Game này đang trong quá trình phát triển!");
    }
  };

  const handleSicBoBetSuccess = (amount, choice) => {
    // Trừ tiền
    setBalance(prev => prev - amount);
    Alert.alert("Thành công", `Đã đặt cược ${amount.toLocaleString('vi-VN')} đ vào cửa ${choice === 'TAI' ? 'TÀI' : 'XỈU'}!`);
  };

  const renderGameCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => handlePlayGame(item.id)}
    >
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
        <View>
          <Text style={styles.greeting}>Xin chào, {fullName}!</Text>
          <Text style={styles.balance}>Số dư: <Text style={styles.balanceAmount}>{balance.toLocaleString('vi-VN')} đ</Text></Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>CÁC TRÒ CHƠI HẤP DẪN</Text>
      
      <FlatList
        data={GAMES}
        renderItem={renderGameCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      {/* SIC BO OVERLAY MODAL */}
      <SicBoModal 
        visible={isSicBoVisible} 
        onClose={() => setIsSicBoVisible(false)} 
        balance={balance}
        onBetSuccess={handleSicBoBetSuccess}
        timeLeft={timeLeft}
        gamePhase={gamePhase}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#350A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    marginBottom: 5,
  },
  logoutBtn: {
    backgroundColor: '#A020F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  greeting: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 2,
  },
  balance: {
    color: '#D4AF37',
    fontSize: 12,
  },
  balanceAmount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
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
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
  },
  cardIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  cardTextContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  cardSubtitle: {
    color: '#F9E596',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  playButtonText: {
    color: '#1E0505',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
