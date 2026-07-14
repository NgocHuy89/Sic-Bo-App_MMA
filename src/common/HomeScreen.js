import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

import api from '../services/api';

// Import Sic Bo Game
import SicBoModal from '../games/SicBo/SicBoModal';
import CustomAlert from './CustomAlert';

const GAMES = [
  {
    id: '1',
    title: 'TÀI XỈU',
    subtitle: 'SIC BO CLASSIC',
    color: '#8B0000',
    icon: '🎲',
  },
  {
    id: '5',
    title: 'MÁY BAY',
    subtitle: 'CHUYẾN BAY MẠO HIỂM',
    color: '#16213e',
    icon: '✈️',
  },
  {
    id: '6',
    title: 'LEO THÁP',
    subtitle: 'ĐI TÌM KHO BÁU',
    color: '#b6914b',
    icon: '🦁',
  },
];

export default function HomeScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const user = route?.params?.user || null;
  const initialBalance = user ? user.balance : 0;
  const fullName = user ? user.full_name : 'Người chơi Vô danh';

  const [balance, setBalance] = useState(initialBalance);
  const isFocused = useIsFocused();

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
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const createNewSession = async () => {
    try {
      const newSession = {
        session_code: `#TX${Date.now().toString().slice(-5)}`,
        status: 'BETTING',
        dice_1: null,
        dice_2: null,
        dice_3: null,
        total_score: null,
        result: null,
        created_at: new Date().toISOString()
      };
      const res = await api.post('/game_sessions', newSession);
      setCurrentSessionId(res.data.id);

      // Rolling window logic: keep max 50 sessions
      const allRes = await api.get('/game_sessions');
      let allSessions = allRes.data;
      if (allSessions.length > 50) {
        allSessions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const sessionsToDelete = allSessions.slice(0, allSessions.length - 50);
        for (const s of sessionsToDelete) {
           if (s.id !== 'current') {
             try {
               await api.delete(`/game_sessions/${s.id}`);
             } catch (delError) {} // Ignore if already deleted by another client
           }
        }
      }
    } catch (e) {
      console.log('Create session error', e);
    }
  };

  useEffect(() => {
    if (gamePhase === 'BETTING') {
      createNewSession();
    }
  }, [gamePhase]);

  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user?.balance, user?.id]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('logged_in_user');
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
    if (!isFocused || !user?.id) return;

    const refreshBalance = async () => {
      try {
        const res = await api.get(`/users/${user.id}`);
        if (res.data?.balance !== undefined) {
          setBalance(res.data.balance);
        }
      } catch (error) {
        console.log('Refresh balance error:', error);
      }
    };

    refreshBalance();
  }, [isFocused, user?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (gamePhase === 'BETTING') {
            setGamePhase('RESULT');
            return 5;
          }

          setGamePhase('BETTING');
          setPlacedBetTai(0);
          setPlacedBetXiu(0);
          return 60;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase]);

  const handlePlayGame = (gameId) => {
    if (gameId === '1') {
      setIsSicBoVisible(true);
    } else if (gameId === '5') {
      navigation.navigate('CrashGame', {
        user,
        userId: user?.id,
        currentBalance: balance,
      });
    } else if (gameId === '6') {
      navigation.navigate('LeoThap', {
        user,
        userId: user?.id,
        currentBalance: balance,
      });
    } else {
      showAlert('Thông báo', 'Game này đang trong quá trình phát triển!');
    }
  };

  const updateBalance = (amountChange) => {
    setBalance((prev) => {
      const newBalance = prev + amountChange;
      if (user?.id) {
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

  const handleSicBoBetSuccess = (amount, choice) => {
    updateBalance(-amount);

    if (choice === 'TAI') {
      setPlacedBetTai((prev) => prev + amount);
    } else {
      setPlacedBetXiu((prev) => prev + amount);
    }

    showAlert('Thành công', `Đã đặt cược ${amount.toLocaleString('vi-VN')} đ vào cửa ${choice === 'TAI' ? 'TÀI' : 'XỈU'}!`);
  };

  const handleCancelPlacedBets = () => {
    const totalPlaced = placedBetTaiRef.current + placedBetXiuRef.current;
    if (totalPlaced > 0) {
      updateBalance(totalPlaced);
      setPlacedBetTai(0);
      setPlacedBetXiu(0);
      showAlert('Thành công', `Đã hoàn lại ${totalPlaced.toLocaleString('vi-VN')} đ tiền cược!`);
    } else {
      showAlert('Thông báo', 'Bạn chưa đặt cược trong phiên này!');
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
      }),
    ]).start(() => {
      setShowWinAnim(false);
    });
  };

  const handleGameResult = async (resultText, dice1, dice2, dice3, total) => {
    const currentBetTai = placedBetTaiRef.current;
    const currentBetXiu = placedBetXiuRef.current;

    let reward = 0;
    if (resultText === 'TAI' && currentBetTai > 0) {
      reward = currentBetTai * rewardRatio;
    } else if (resultText === 'XIU' && currentBetXiu > 0) {
      reward = currentBetXiu * rewardRatio;
    }

    if (reward > 0) {
      updateBalance(reward);
      triggerWinAnimation(reward);
    }

    if (currentSessionId) {
      try {
        await api.patch(`/game_sessions/${currentSessionId}`, {
          status: 'COMPLETED',
          dice_1: dice1,
          dice_2: dice2,
          dice_3: dice3,
          total_score: total,
          result: resultText
        });
      } catch (e) {
        console.log('Update session error:', e);
      }
    }
  };

  const renderGameCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.color, width: isPortrait ? '100%' : '48%' }]}
      onPress={() => handlePlayGame(item.id)}
    >
      <View style={[styles.cardContent, isPortrait && { paddingVertical: 30 }]}>
        <Text style={[styles.cardIcon, isPortrait && { fontSize: 80, marginBottom: 20 }]}>{item.icon}</Text>
        <View style={styles.cardTextContainer}>
          <Text style={[styles.cardTitle, isPortrait && { fontSize: 24 }]}>{item.title}</Text>
          <Text style={[styles.cardSubtitle, isPortrait && { fontSize: 14 }]}>{item.subtitle}</Text>
        </View>
        <View style={[styles.playButton, isPortrait && { paddingVertical: 12, paddingHorizontal: 30 }]}>
          <Text style={[styles.playButtonText, isPortrait && { fontSize: 16 }]}>CHƠI NGAY</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {fullName}!</Text>
          <Text style={styles.balance}>
            Số dư:{' '}
            <Text style={styles.balanceAmount}>{balance.toLocaleString('vi-VN')} đ</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>CÁC TRÒ CHƠI HẤP DẪN</Text>

      <FlatList
        key={isPortrait ? '1col' : '2col'}
        data={GAMES}
        renderItem={renderGameCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        numColumns={isPortrait ? 1 : 2}
        columnWrapperStyle={isPortrait ? undefined : styles.row}
        showsVerticalScrollIndicator={false}
      />

      {showWinAnim && (
        <View style={styles.winAnimContainer}>
          <Text style={styles.winAnimText}>+{winAmount.toLocaleString('vi-VN')} đ</Text>
        </View>
      )}

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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
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
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
