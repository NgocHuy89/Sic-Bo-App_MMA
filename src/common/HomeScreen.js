import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';

// Import Sic Bo Game
import SicBoModal from '../games/SicBo/SicBoModal';
import CustomAlert from './CustomAlert';

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

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ visible: true, title, message });
  };

  const [placedBetTai, _setPlacedBetTai] = useState(0);
  const [placedBetXiu, _setPlacedBetXiu] = useState(0);
  
  const placedBetTaiRef = useRef(0);
  const placedBetXiuRef = useRef(0);

  const setPlacedBetTai = (val) => {
    const newVal = typeof val === 'function' ? val(placedBetTaiRef.current) : val;
    placedBetTaiRef.current = newVal;
    _setPlacedBetTai(newVal);
  };

  const setPlacedBetXiu = (val) => {
    const newVal = typeof val === 'function' ? val(placedBetXiuRef.current) : val;
    placedBetXiuRef.current = newVal;
    _setPlacedBetXiu(newVal);
  };

  const [rewardRatio, setRewardRatio] = useState(1.8);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinAnim, setShowWinAnim] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

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
    const fetchConfig = async () => {
      try {
        const res = await api.get('/system_configs?key=REWARD_RATIO_TAI_XIU');
        if (res.data && res.data.length > 0) {
          setRewardRatio(parseFloat(res.data[0].value) || 1.8);
        }
      } catch (e) {
        console.log('Fetch config error:', e);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (gamePhase === 'BETTING') {
            setGamePhase('RESULT');
            return 5; // 5 giây xem kết quả
          } else {
            setGamePhase('BETTING');
            setPlacedBetTai(0);
            setPlacedBetXiu(0);
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
      showAlert("Thông báo", "Game này đang trong quá trình phát triển!");
    }
  };

  const updateBalance = (amountChange) => {
    setBalance(prev => {
      const newBalance = prev + amountChange;
      if (user && user.id) {
        const saveBalance = async () => {
          try {
            const updatedUser = { ...user, balance: newBalance };
            await AsyncStorage.setItem('logged_in_user', JSON.stringify(updatedUser));
            await api.patch(`/users/${user.id}`, { balance: newBalance });
          } catch (error) {
            console.log('Update balance error:', error);
          }
        };
        saveBalance();
      }
      return newBalance;
    });
  };

  const handleSicBoBetSuccess = async (amount, choice) => {
    if (!user) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return;
    }
    try {
      // Lấy phiên đang BETTING hiện tại
      const sessionsRes = await api.get('/game_sessions?status=BETTING');
      const bettingSession = sessionsRes.data[0];
      if (!bettingSession) {
        Alert.alert('Thông báo', 'Hiện không có phiên game nào đang mở cược.');
        return;
      }

      // Cập nhật LOCAL state (cho UX mượt)
      updateBalance(-amount);
      if (choice === 'TAI') {
        setPlacedBetTai(prev => prev + amount);
      } else {
        setPlacedBetXiu(prev => prev + amount);
      }

      // Cập nhật DB async (không block UI)
      api.post('/bets', {
        user_id: user.id,
        session_id: bettingSession.id,
        bet_choice: choice,
        bet_amount: amount,
        win_amount: 0,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      }).catch(e => console.error('Bet sync error:', e));
    } catch (e) {
      console.error('Bet error:', e);
      Alert.alert('Lỗi', 'Không thể đặt cược. Vui lòng thử lại.');
    }
  };

  const handleCancelPlacedBets = () => {
    const totalPlaced = placedBetTaiRef.current + placedBetXiuRef.current;
    if (totalPlaced > 0) {
      updateBalance(totalPlaced);
      setPlacedBetTai(0);
      setPlacedBetXiu(0);
      showAlert("Thành công", `Đã hoàn lại ${totalPlaced.toLocaleString('vi-VN')} đ tiền cược!`);
    } else {
      showAlert("Thông báo", "Bạn chưa đặt cược trong phiên này!");
    }
  };

  const triggerWinAnimation = (amount) => {
    setWinAmount(amount);
    setShowWinAnim(true);
    fadeAnim.setValue(1);
    floatAnim.setValue(0);

    Animated.parallel([
      Animated.timing(floatAnim, {
        toValue: -150,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 2500,
        delay: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowWinAnim(false);
    });
  };

  const handleGameResult = (resultText) => {
    const currentBetTai = placedBetTaiRef.current;
    const currentBetXiu = placedBetXiuRef.current;
    
    console.log(`[DEBUG] handleGameResult: resultText=${resultText}, placedBetTai=${currentBetTai}, placedBetXiu=${currentBetXiu}`);
    let reward = 0;
    if (resultText === 'TAI' && currentBetTai > 0) {
      reward = currentBetTai * rewardRatio;
    } else if (resultText === 'XIU' && currentBetXiu > 0) {
      reward = currentBetXiu * rewardRatio;
    }

    console.log(`[DEBUG] handleGameResult: reward=${reward}`);

    if (reward > 0) {
      updateBalance(reward);
      triggerWinAnimation(reward);
    }
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
        placedBetTai={placedBetTai}
        placedBetXiu={placedBetXiu}
        onCancelPlacedBets={handleCancelPlacedBets}
        onResult={handleGameResult}
      />

      {/* Hiệu ứng cộng tiền bọc trong Modal để nằm đè lên SicBoModal */}
      <Modal visible={showWinAnim} transparent={true} animationType="none">
        <Animated.View style={[
          styles.winAnimContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: floatAnim }]
          }
        ]} pointerEvents="none">
          <Text style={styles.winAnimText}>+{winAmount.toLocaleString('vi-VN')} đ</Text>
        </Animated.View>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  winAnimContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  winAnimText: {
    color: '#00FF00',
    fontSize: 40,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
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
