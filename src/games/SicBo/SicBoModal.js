import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Alert,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { styles } from './SicBoStyles';
import api from '../../services/api';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CHIPS = [
  { label: '1K', value: 1000 },
  { label: '10K', value: 10000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '500K', value: 500000 },
  { label: '5M', value: 5000000 },
  { label: '10M', value: 10000000 },
  { label: '50M', value: 50000000 },
];

export default function SicBoModal({ visible, onClose, balance, onBetSuccess, timeLeft, gamePhase, placedBetTai = 0, placedBetXiu = 0, onCancelPlacedBets, onResult }) {
  const [betAmount, setBetAmount] = useState(0);
  const [betChoice, setBetChoice] = useState(null);
  const [history, setHistory] = useState([]);
  
  const DICE_FACES = ['dice-one', 'dice-two', 'dice-three', 'dice-four', 'dice-five', 'dice-six'];
  const [diceResults, setDiceResults] = useState(['dice-one', 'dice-three', 'dice-five']);
  const evaluatedPhase = useRef(null);

  const pos1 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pos2 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pos3 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const rot1 = useRef(new Animated.Value(0)).current;
  const rot2 = useRef(new Animated.Value(0)).current;
  const rot3 = useRef(new Animated.Value(0)).current;

  const [winningChoice, setWinningChoice] = useState(null);
  const pulseAnimTai = useRef(new Animated.Value(1)).current;
  const pulseAnimXiu = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animActive = true;
    let faceInterval;

    if (visible && gamePhase === 'BETTING') {
      if (evaluatedPhase.current !== 'BETTING') {
        evaluatedPhase.current = 'BETTING';
        setWinningChoice(null);
        pulseAnimTai.stopAnimation();
        pulseAnimTai.setValue(1);
        pulseAnimXiu.stopAnimation();
        pulseAnimXiu.setValue(1);
      }

      // Đệ quy thay đổi tọa độ liên tục
      const animatePos = (posAnim) => {
        const randomX = (Math.random() - 0.5) * 50; 
        const randomY = (Math.random() - 0.5) * 50; 
        
        Animated.timing(posAnim, {
          toValue: { x: randomX, y: randomY },
          duration: 150 + Math.random() * 150, 
          easing: Easing.linear,
          useNativeDriver: false
        }).start(({ finished }) => {
          if (finished && animActive) animatePos(posAnim);
        });
      };

      // Xoay liên tục
      const animateRot = (rotAnim, duration) => {
        Animated.loop(
          Animated.timing(rotAnim, {
            toValue: 1,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: false
          })
        ).start();
      };

      animatePos(pos1);
      animatePos(pos2);
      animatePos(pos3);

      animateRot(rot1, 200);
      animateRot(rot2, 350);
      animateRot(rot3, 250);

      // Đảo mặt xúc xắc tốc độ cao khi đang quay
      faceInterval = setInterval(() => {
        setDiceResults([
          DICE_FACES[Math.floor(Math.random() * 6)],
          DICE_FACES[Math.floor(Math.random() * 6)],
          DICE_FACES[Math.floor(Math.random() * 6)],
        ]);
      }, 80);

    } else {
      animActive = false;
      clearInterval(faceInterval);
      pos1.stopAnimation(); pos2.stopAnimation(); pos3.stopAnimation();
      rot1.stopAnimation(); rot2.stopAnimation(); rot3.stopAnimation();

      // Dàn đều 3 viên xúc xắc ra 3 vị trí để tránh bị đè lên nhau thành 1 viên
      pos1.setValue({x: -25, y: 0}); 
      pos2.setValue({x: 0, y: 0}); 
      pos3.setValue({x: 25, y: 0});
      rot1.setValue(0); rot2.setValue(0); rot3.setValue(0);

      // Random kết quả nếu đang ở pha kết quả
      if (gamePhase === 'RESULT' && evaluatedPhase.current !== 'RESULT') {
        evaluatedPhase.current = 'RESULT';
        const r1 = Math.floor(Math.random() * 6);
        const r2 = Math.floor(Math.random() * 6);
        const r3 = Math.floor(Math.random() * 6);
        
        // Hiển thị mặt xúc xắc đúng với kết quả
        setDiceResults([DICE_FACES[r1], DICE_FACES[r2], DICE_FACES[r3]]);
        
        const sum = r1 + r2 + r3 + 3;
        const resultText = (sum >= 11) ? 'TAI' : 'XIU';
        console.log(`[DEBUG] SicBoModal: Generated resultText=${resultText}, onResult is defined: ${!!onResult}`);
        setHistory(prev => {
          const newHist = [...prev, resultText];
          if (newHist.length > 14) newHist.shift();
          return newHist;
        });
        
        setWinningChoice(resultText);

        const targetAnim = resultText === 'TAI' ? pulseAnimTai : pulseAnimXiu;
        Animated.loop(
          Animated.sequence([
            Animated.timing(targetAnim, {
              toValue: 1.1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(targetAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            })
          ])
        ).start();

        if (onResult) {
          onResult(resultText);
        }
      }
    }

    return () => { 
      animActive = false; 
      clearInterval(faceInterval);
    };
  }, [visible, gamePhase, pos1, pos2, pos3, rot1, rot2, rot3]);

  const getTransform = (posAnim, rotAnim) => {
    return [
      { translateX: posAnim.x },
      { translateY: posAnim.y },
      {
        rotate: rotAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })
      }
    ];
  };

  useEffect(() => {
    if (visible) {
      fetchHistory();
    }
  }, [visible]);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/game_sessions?status=COMPLETED');
      if (response.data) {
        const results = response.data
          .map(session => session.result)
          .filter(res => res) // Lọc bỏ kết quả trống
          .slice(-14); // Giới hạn 14 kết quả hiển thị cho vừa màn hình
        setHistory(results);
      }
    } catch (error) {
      console.log('Error fetching history:', error);
    }
  };

  // Fake data mô phỏng tiền tổng cược của toàn mạng (giống hình ảnh)
  const totalTaiPool = 741648460;
  const totalXiuPool = 741648460;

  const handleAddChip = (val) => {
    setBetAmount(prev => prev + val);
  };

  const handleAllIn = () => {
    setBetAmount(balance);
  };

  const handleCloseModal = () => {
    setBetAmount(0);
    setBetChoice(null);
    onClose();
  };

  const handleCancelBet = () => {
    if (gamePhase === 'RESULT') {
      Alert.alert("Thông báo", "Đã hết thời gian hủy cược!");
      return;
    }
    setBetAmount(0);
    setBetChoice(null);
    
    if (onCancelPlacedBets) {
      onCancelPlacedBets();
    }
  };

  const handleConfirmBet = () => {
    if (gamePhase === 'RESULT') {
      Alert.alert("Thông báo", "Đã hết thời gian đặt cược, vui lòng đợi phiên tiếp theo!");
      return;
    }
    if (!betChoice) {
      Alert.alert("Lỗi", "Vui lòng chọn cửa cược (TÀI hoặc XỈU)!");
      return;
    }
    if (betAmount <= 0) {
      Alert.alert("Lỗi", "Vui lòng đặt cược số tiền hợp lệ!");
      return;
    }
    if (betAmount > balance) {
      Alert.alert("Lỗi", "Số dư không đủ để đặt cược!");
      return;
    }
    
    onBetSuccess(betAmount, betChoice);
    
    setBetAmount(0);
    setBetChoice(null);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelBet}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.globalCloseBtn} onPress={handleCloseModal}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <View style={styles.headerContainer}>
              <Text style={styles.titleText}>🎲 TÀI XỈU 🎲</Text>
              <View style={styles.headerInfoRow}>
                <Text style={[styles.timerText, { color: timeLeft <= 10 ? '#FF0000' : '#D4AF37' }]}>
                  {gamePhase === 'BETTING' ? `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}` : 'KẾT QUẢ'}
                </Text>
                <Text style={styles.balanceText}>
                  💰 {balance.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>

            <View style={styles.boardContainer}>
              <View style={styles.boardContent}>
                {/* PANEL TÀI */}
                <AnimatedTouchableOpacity 
                  style={[
                    styles.doorPanel, 
                    betChoice === 'TAI' && styles.doorPanelActive,
                    winningChoice === 'TAI' && { borderColor: '#FBE8A6', borderWidth: 4, backgroundColor: 'rgba(229, 185, 92, 0.3)', shadowColor: '#FBE8A6', shadowOpacity: 1, shadowRadius: 15, elevation: 10 },
                    { transform: [{ scale: pulseAnimTai }] }
                  ]}
                  onPress={() => setBetChoice('TAI')}
                >
                  <Text style={[styles.doorTitle, styles.doorTitleTai, betChoice === 'TAI' && styles.doorTitleActive]}>TÀI</Text>
                  <View style={styles.doorTotalBet}>
                    <Text style={styles.doorTotalBetText}>{totalTaiPool.toLocaleString('vi-VN')}</Text>
                  </View>
                  <View style={styles.doorMyBet}>
                    <Text style={styles.doorMyBetText}>{(placedBetTai + (betChoice === 'TAI' ? betAmount : 0)).toLocaleString('vi-VN')}</Text>
                  </View>
                </AnimatedTouchableOpacity>

                {/* DÍCE CENTER */}
                <View style={styles.diceCenterContainer}>
                  <View style={styles.diceIconGroup}>
                    <Animated.View style={[{ position: 'absolute', transform: getTransform(pos1, rot1) }]}>
                      <FontAwesome5 name={diceResults[0]} size={32} color="#FFFFFF" solid />
                    </Animated.View>
                    <Animated.View style={[{ position: 'absolute', transform: getTransform(pos2, rot2) }]}>
                      <FontAwesome5 name={diceResults[1]} size={32} color="#FFFFFF" solid />
                    </Animated.View>
                    <Animated.View style={[{ position: 'absolute', transform: getTransform(pos3, rot3) }]}>
                      <FontAwesome5 name={diceResults[2]} size={32} color="#FFFFFF" solid />
                    </Animated.View>
                  </View>
                  {betAmount > 0 && (
                    <View style={styles.centerBetHighlight}>
                      <Text 
                        style={styles.centerBetText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        +{betAmount.toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* PANEL XỈU */}
                <AnimatedTouchableOpacity 
                  style={[
                    styles.doorPanel, 
                    betChoice === 'XIU' && styles.doorPanelActive,
                    winningChoice === 'XIU' && { borderColor: '#FBE8A6', borderWidth: 4, backgroundColor: 'rgba(229, 185, 92, 0.3)', shadowColor: '#FBE8A6', shadowOpacity: 1, shadowRadius: 15, elevation: 10 },
                    { transform: [{ scale: pulseAnimXiu }] }
                  ]}
                  onPress={() => setBetChoice('XIU')}
                >
                  <Text style={[styles.doorTitle, styles.doorTitleXiu, betChoice === 'XIU' && styles.doorTitleActive]}>XỈU</Text>
                  <View style={styles.doorTotalBet}>
                    <Text style={styles.doorTotalBetText}>{totalXiuPool.toLocaleString('vi-VN')}</Text>
                  </View>
                  <View style={styles.doorMyBet}>
                    <Text style={styles.doorMyBetText}>{(placedBetXiu + (betChoice === 'XIU' ? betAmount : 0)).toLocaleString('vi-VN')}</Text>
                  </View>
                </AnimatedTouchableOpacity>
              </View>
            </View>

          {/* LỊCH SỬ PHIÊN CHƠI */}
          <View style={styles.historyContainer}>
              {history.map((res, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.historyDot, 
                    res === 'TAI' ? styles.historyDotTai : styles.historyDotXiu
                  ]} 
                />
              ))}
            </View>

            {/* ROW CHIPS */}
            <View style={styles.chipsWrapper}>
              <View style={styles.chipsContainer}>
                {CHIPS.map((chip, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.chipButton}
                    onPress={() => handleAddChip(chip.value)}
                  >
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* BOTTOM ACTION BUTTONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.allInBtn]} onPress={handleAllIn}>
                <Text style={styles.actionBtnText}>ALL-IN</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.confirmBtn, gamePhase === 'RESULT' && { opacity: 0.5 }]} 
                onPress={handleConfirmBet}
              >
                <Text style={styles.confirmBtnText}>ĐẶT CƯỢC</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancelBet}>
                <Text style={styles.actionBtnText}>HỦY</Text>
              </TouchableOpacity>
            </View>

        </ScrollView>
      </View>
    </Modal>
  );
}
