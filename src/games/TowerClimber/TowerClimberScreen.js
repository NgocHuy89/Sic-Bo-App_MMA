/**
 * TowerClimberScreen.jsx
 * Tower Climber — Leo Tháp
 *
 * 8 tầng × 3 ô. Mỗi tầng có 1 bom, 2 an toàn.
 * Màn hình cuộn lên theo người chơi (tầng active luôn ở giữa).
 * Thiết kế: đá cổ xưa + ánh vàng + particles rơi.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  useWindowDimensions,
  Platform
} from "react-native";
import api from '../../services/api';
// ─── GAME CONFIG ──────────────────────────────────────────────────────────────
const COLS = 3;
const ROWS = 8;
const BOMBS_PER_ROW = 1;
// Cấu hình IP tự động đã được chuyển qua services/api.js
// Multiplier cho mỗi tầng (index 0 = tầng 1)
const MULTIPLIERS = [1.42, 2.02, 2.88, 4.1, 5.84, 8.32, 11.85, 16.88];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const buildBoard = () => {
  return Array.from({ length: ROWS }, (_, rowIndex) => {
    const cols = Array(COLS).fill("safe");

    // Tầng 6 trở lên (index 5, 6, 7) sẽ có 2 bom, các tầng dưới có 1 bom
    const numBombs = rowIndex >= 5 ? 2 : 1;

    let bombsPlaced = 0;
    while (bombsPlaced < numBombs) {
      const bombIdx = Math.floor(Math.random() * COLS);
      // Nếu ô đó chưa có bom thì mới đặt
      if (cols[bombIdx] !== "bomb") {
        cols[bombIdx] = "bomb";
        bombsPlaced++;
      }
    }
    return cols;
  });
};

// ─── SPARKLE COMPONENT ────────────────────────────────────────────────────────
const Sparkle = ({ style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900 + Math.random() * 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900 + Math.random() * 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim }]}>
      <Text style={{ fontSize: 8, color: "#FFD700" }}>✦</Text>
    </Animated.View>
  );
};

// ─── CELL COMPONENT ───────────────────────────────────────────────────────────
const Cell = ({
  state,
  onPress,
  disabled,
  rowIndex,
  multiplier,
  isActiveRow,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Glow pulse khi là tầng active
  useEffect(() => {
    let loopAnimation; // Tạo một biến để giữ lại cái vòng lặp này

    if (isActiveRow && state === "hidden") {
      loopAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      loopAnimation.start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }

    // HÀM DỌN DẸP (CLEANUP): Tự động kích hoạt khi ô này bị hủy hoặc thoát game
    return () => {
      if (loopAnimation) loopAnimation.stop();
      glowAnim.stopAnimation();
    };
  }, [isActiveRow, state]);

  const handlePress = () => {
    // Scale down on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.08,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (state === "bomb_revealed") {
      // Shake for bomb
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 5,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPress();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  // Visual per state
  // Phân loại Visual UI cực kỳ rõ ràng giữa Clickable và Disabled
  // Đã xóa bỏ thuộc tính shadowColor không cần thiết
  let cellBg, icon, label, borderColor, iconColor;
  
  switch (state) {
    case 'hidden':
      cellBg = disabled ? '#0f1626' : '#243b6b';      
      borderColor = disabled ? '#1c283d' : '#6b9cff'; 
      iconColor = disabled ? '#2a3d5a' : '#ffffff';   
      icon = '?';
      break;
    case 'safe_revealed':
      cellBg = '#0d2218';
      borderColor = '#00c853';
      icon = '💎';
      label = `${multiplier}x`;
      break;
    case 'bomb_revealed':
      cellBg = '#2a0a0a';
      borderColor = '#ff3333';
      icon = '💣';
      break;
    case 'safe_auto': 
      cellBg = '#0a1a10';
      borderColor = '#1a4a2a';
      icon = '💎';
      break;
    default:
      cellBg = '#101824';
      borderColor = '#1a2535';
      icon = '';
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }}>
      {/* Vòng sáng nhấp nháy cho ô đang Active */}
      {isActiveRow && state === 'hidden' && !disabled && (
        <Animated.View 
          style={[styles.cellGlowRing, { borderColor, opacity: glowOpacity }]} 
          pointerEvents="none" 
        />
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.6}
        style={[
          styles.cell,
          // Chỉ giữ lại màu nền và viền. Cắt bỏ hoàn toàn shadow/elevation để chống xô lệch trên Android!
          { backgroundColor: cellBg, borderColor } 
        ]}
      >
        <Text style={[styles.cellIcon, { color: iconColor }]}>{icon}</Text>
        {label && <Text style={styles.cellLabel}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── FLOOR ROW ────────────────────────────────────────────────────────────────
const FloorRow = ({
  rowIndex,
  cells,
  revealedCells,
  onCellPress,
  gameState,
  activeRow,
}) => {
  const isActiveRow = rowIndex === activeRow;
  const isPast = rowIndex < activeRow;
  const isFuture = rowIndex > activeRow;
  const floorNum = rowIndex + 1;

  const rowOpacity = isFuture ? 0.45 : 1;

  return (
    <View style={[styles.floorRow, { opacity: rowOpacity }]}>
      {/* Floor number + multiplier label */}
      <View style={styles.floorMeta}>
        <Text style={[styles.floorNum, isActiveRow && { color: "#4a7aff" }]}>
          {floorNum < 10 ? `0${floorNum}` : floorNum}
        </Text>
        <Text style={[styles.floorMult, isActiveRow && { color: "#FFD700" }]}>
          {MULTIPLIERS[rowIndex].toFixed(2)}x
        </Text>
      </View>

      {/* Cells */}
      <View style={styles.cellRow}>
        {cells.map((cellType, colIdx) => {
          const revealedState = revealedCells[`${rowIndex}-${colIdx}`];
          let displayState;

          if (revealedState) {
            displayState = revealedState;
          } else if (!isActiveRow || gameState === "idle") {
            displayState = "hidden";
          } else {
            displayState = "hidden";
          }

          const canPress =
            gameState === "playing" && isActiveRow && !revealedState;

          return (
            <Cell
              key={colIdx}
              state={displayState}
              onPress={() => onCellPress(rowIndex, colIdx)}
              disabled={!canPress}
              rowIndex={rowIndex}
              multiplier={MULTIPLIERS[rowIndex]}
              isActiveRow={isActiveRow && gameState === "playing"}
            />
          );
        })}
      </View>

      {/* Connector line to next floor */}
      {rowIndex < ROWS - 1 && (
        <View style={styles.connector}>
          <View
            style={[
              styles.connectorLine,
              isPast && { backgroundColor: "#00c853" },
              isActiveRow && { backgroundColor: "#4a7aff" },
            ]}
          />
        </View>
      )}
    </View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function TowerClimberScreen({ navigation, route }) {
  const initialBalance = route?.params?.currentBalance ?? 500_000;
  const { width, height } = useWindowDimensions();

  // 1. Nhận userId từ màn hình đăng nhập truyền sang
  const currentUserId = route?.params?.userId; 
  const isPortrait = height > width;

  // ── State ──────────────────────────────────────────────────────────────────
  const [balance, setBalance] = useState(initialBalance);
  const [betAmount, setBetAmount] = useState("10000");
  const [gameState, setGameState] = useState("idle"); // idle|playing|cashed_out|crashed
  const [board, setBoard] = useState(() => buildBoard());
  const [activeRow, setActiveRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [revealedCells, setRevealedCells] = useState({});
  const [currentBet, setCurrentBet] = useState(0);
  const [myBets, setMyBets] = useState([]);

  const scrollRef = useRef(null);
  const betRef = useRef("10000");

const syncBalanceToDB = async (newBalance) => {
    console.log("--- BẮT ĐẦU ĐỒNG BỘ DB ---");
    console.log("1. User ID hiện tại:", currentUserId);
    console.log("2. Số dư mới cần lưu:", newBalance);

    if (!currentUserId) {
      console.warn("❌ CẢNH BÁO: Không tìm thấy currentUserId! Màn hình trước chưa truyền 'userId' sang.");
      return; 
    }

    try {
      const url = `/users/${currentUserId}`;
      console.log("3. Đang gọi API tới link:", url);
      
      const response = await api.patch(url, { balance: newBalance });
      console.log("✅ 4. LƯU THÀNH CÔNG! Dữ liệu phản hồi:", response.data);
    } catch (error) {
      console.error("❌ 4. LỖI CẬP NHẬT DB:", error.message);
    }
  };

  // Scroll tầng active vào giữa màn hình
  const scrollToActiveRow = useCallback((row) => {
    // Tầng hiển thị từ trên xuống dưới (ROWS-1 ở trên, 0 ở dưới)
    // Mỗi FloorRow cao ~80px + 20 connector
    const ITEM_H = 100;
    const visibleRows = ROWS - 1 - row; // index từ trên xuống
    const offset = visibleRows * ITEM_H - 80;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, offset), animated: true });
    }, 100);
  }, []);

  // ── Place bet ──────────────────────────────────────────────────────────────
  const handlePlaceBet = () => {
    const bet = parseInt(betRef.current);
    if (!bet || bet <= 0 || bet > balance) {
      Alert.alert("Lỗi", "Số tiền cược không hợp lệ!");
      return;
    }

    // TRỪ TIỀN VÀ LƯU VÀO DB
    const newBalance = balance - bet;
    setBalance(newBalance);
    syncBalanceToDB(newBalance);

    const newBoard = buildBoard();
    setBoard(newBoard);
    setRevealedCells({});
    setActiveRow(0);
    setMultiplier(1.0);
    setCurrentBet(bet);
    setGameState("playing");
    scrollToActiveRow(0);
  };

  // ── Cell press ─────────────────────────────────────────────────────────────
  const handleCellPress = (rowIndex, colIdx) => {
    if (gameState !== "playing" || rowIndex !== activeRow) return;

    const cellType = board[rowIndex][colIdx];
    const newRevealed = { ...revealedCells };

    if (cellType === "bomb") {
      // Reveal bomb + reveal all safe cells and other bombs on this row
      board[rowIndex].forEach((type, ci) => {
        let state;
        if (ci === colIdx) {
          state = "bomb_revealed"; // Quả bom bạn vừa dẫm trúng (sẽ rung lắc)
        } else if (type === "bomb") {
          state = "bomb_revealed"; // Quả bom thứ 2 (nếu có) lộ diện
        } else {
          state = "safe_auto"; // Hiện kim cương ở các ô an toàn
        }
        newRevealed[`${rowIndex}-${ci}`] = state;
      });
      setRevealedCells(newRevealed);
      setGameState("crashed");

      // Ghi lịch sử
      setMyBets((prev) =>
        [
          {
            id: Date.now().toString(),
            bet: currentBet,
            reachedFloor: rowIndex + 1,
            cashOutMult: 0,
            profit: -currentBet,
          },
          ...prev,
        ].slice(0, 30),
      );
    } else {
      // Safe — reveal cell, advance
      newRevealed[`${rowIndex}-${colIdx}`] = "safe_revealed";
      setRevealedCells(newRevealed);

      const newMult = MULTIPLIERS[rowIndex];
      setMultiplier(newMult);

      if (rowIndex === ROWS - 1) {
        // Đạt đỉnh!
        const reward = Math.floor(currentBet * newMult);

        // CỘNG TIỀN VÀ LƯU VÀO DB
        const newBalance = balance + reward;
        setBalance(newBalance);
        syncBalanceToDB(newBalance);

        setGameState("cashed_out");
        setMyBets((prev) =>
          [
            {
              id: Date.now().toString(),
              bet: currentBet,
              reachedFloor: ROWS,
              cashOutMult: newMult,
              profit: reward - currentBet,
            },
            ...prev,
          ].slice(0, 30),
        );
        Alert.alert(
          "🏆 Đỉnh tháp!",
          `Bạn đã chinh phục tháp! +${(reward - currentBet).toLocaleString("vi-VN")} đ`,
        );
      } else {
        const nextRow = rowIndex + 1;
        setActiveRow(nextRow);
        scrollToActiveRow(nextRow);
      }
    }
  };

  // ── Cash out ────────────────────────────────────────────────────────────────
  const handleCashOut = () => {
    if (gameState !== "playing" || activeRow === 0 || multiplier === 1.0)
      return;
    // Chỉ được cashout sau khi đã vượt ít nhất 1 tầng
    const lastClearedRow = activeRow - 1;
    const cashMult = MULTIPLIERS[lastClearedRow];
    const reward = Math.floor(currentBet * cashMult);

    const newBalance = balance + reward;
    setBalance(newBalance);
    syncBalanceToDB(newBalance);
    setBalance((b) => b + reward);
    setGameState("cashed_out");
    setMyBets((prev) =>
      [
        {
          id: Date.now().toString(),
          bet: currentBet,
          reachedFloor: activeRow,
          cashOutMult: cashMult,
          profit: reward - currentBet,
        },
        ...prev,
      ].slice(0, 30),
    );
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setGameState("idle");
    setBoard(buildBoard());
    setRevealedCells({});
    setActiveRow(0);
    setMultiplier(1.0);
    setCurrentBet(0);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Bet adjustment ──────────────────────────────────────────────────────────
  const adjustBet = (action, value) => {
    if (gameState === "playing") return;
    let v = parseInt(betAmount) || 0;
    if (action === "set") v = value;
    else if (action === "add") v += value;
    else if (action === "sub") v -= value;
    else if (action === "mul") v *= value;
    else if (action === "div") v = Math.floor(v / value);
    v = Math.max(0, Math.min(v, balance));
    setBetAmount(String(v));
    betRef.current = String(v);
  };

  const canCashOut = gameState === "playing" && activeRow > 0;
  const isPlaying = gameState === "playing";

  // Rows hiển thị từ trên xuống (tầng 8 ở trên, tầng 1 ở dưới)
  const displayRows = [...Array(ROWS).keys()].reverse();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={isPlaying}
        >
          <Text style={[styles.backBtnText, isPlaying && { opacity: 0.3 }]}>
            ← Thoát
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>TOWER CLIMBER</Text>
          <Text style={styles.headerSub}>LEO THÁP</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.balLabel}>Số dư</Text>
          <Text style={styles.balValue}>
            {balance.toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </View>

      {/* ── Main layout ── */}
      <View style={styles.mainLayout}>
        {/* LEFT: Tower */}
        <View style={styles.towerWrap}>
          {/* Crown */}
          <View style={styles.towerCrown}>
            <Text style={styles.crownText}>🏆</Text>
            <Text style={styles.crownLabel}>
              {MULTIPLIERS[ROWS - 1].toFixed(2)}x
            </Text>
          </View>

          {/* Scrollable floors */}
          <ScrollView
            ref={scrollRef}
            style={styles.towerScroll}
            contentContainerStyle={styles.towerContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {displayRows.map((rowIndex) => (
              <FloorRow
                key={rowIndex}
                rowIndex={rowIndex}
                cells={board[rowIndex]}
                revealedCells={revealedCells}
                onCellPress={handleCellPress}
                gameState={gameState}
                activeRow={activeRow}
              />
            ))}
          </ScrollView>

          {/* Base */}
          <View style={styles.towerBase}>
            <View style={styles.baseBar} />
            <Text style={styles.baseLabel}>1.00x</Text>
          </View>
        </View>

        {/* RIGHT: Controls + History */}
        <View style={styles.rightPanel}>
          {/* Status card */}
          <View style={styles.statusCard}>
            {gameState === "idle" && (
              <Text style={styles.statusIdle}>
                Đặt cược để bắt đầu leo tháp
              </Text>
            )}
            {gameState === "playing" && (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabelText}>Tầng hiện tại</Text>
                  <Text style={styles.statusValueBlue}>
                    {activeRow + 1} / {ROWS}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabelText}>Hệ số tiếp theo</Text>
                  <Text style={styles.statusValueGold}>
                    {MULTIPLIERS[activeRow].toFixed(2)}x
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabelText}>Đang cược</Text>
                  <Text style={styles.statusValueWhite}>
                    {currentBet.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                {canCashOut && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabelText}>Có thể thu về</Text>
                    <Text style={styles.statusValueGreen}>
                      {Math.floor(
                        currentBet * MULTIPLIERS[activeRow - 1],
                      ).toLocaleString("vi-VN")}
                      đ
                    </Text>
                  </View>
                )}
              </>
            )}
            {gameState === "cashed_out" && (
              <View style={styles.statusResult}>
                <Text style={styles.resultIcon}>💰</Text>
                <Text style={styles.resultTitle}>Chốt lời thành công!</Text>
                <Text style={styles.resultSub}>
                  +
                  {(
                    Math.floor(
                      currentBet *
                        MULTIPLIERS[activeRow > 0 ? activeRow - 1 : 0],
                    ) - currentBet
                  ).toLocaleString("vi-VN")}
                  đ
                </Text>
              </View>
            )}
            {gameState === "crashed" && (
              <View style={styles.statusResult}>
                <Text style={styles.resultIcon}>💣</Text>
                <Text style={[styles.resultTitle, { color: "#ff4444" }]}>
                  Tháp sập!
                </Text>
                <Text style={[styles.resultSub, { color: "#ff6b6b" }]}>
                  Mất {currentBet.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
          </View>

          {/* Bet input */}
          {(gameState === "idle" ||
            gameState === "crashed" ||
            gameState === "cashed_out") && (
            <View style={styles.betPanel}>
              <Text style={styles.betPanelLabel}>TIỀN CƯỢC</Text>
              <TextInput
                style={styles.betInput}
                keyboardType="numeric"
                value={betAmount}
                onChangeText={(t) => {
                  setBetAmount(t);
                  betRef.current = t;
                }}
                editable={gameState !== "playing"}
              />
              <View style={styles.btnRow}>
                {[
                  [10000, "10k"],
                  [50000, "50k"],
                  [100000, "100k"],
                  [500000, "500k"],
                ].map(([v, l]) => (
                  <TouchableOpacity
                    key={l}
                    style={styles.presetBtn}
                    onPress={() => adjustBet("set", v)}
                  >
                    <Text style={styles.presetBtnText}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.btnRow}>
                {[
                  ["/2", "div", 2],
                  ["x2", "mul", 2],
                  ["+10k", "add", 10000],
                  ["-10k", "sub", 10000],
                ].map(([l, a, v]) => (
                  <TouchableOpacity
                    key={l}
                    style={styles.modBtn}
                    onPress={() => adjustBet(a, v)}
                  >
                    <Text style={styles.modBtnText}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionArea}>
            {gameState === "idle" && (
              <TouchableOpacity
                style={styles.btnStart}
                onPress={handlePlaceBet}
              >
                <Text style={styles.btnStartText}>🗼 BẮT ĐẦU LEO</Text>
              </TouchableOpacity>
            )}
            {(gameState === "crashed" || gameState === "cashed_out") && (
              <TouchableOpacity
                style={styles.btnRetry}
                onPress={handlePlaceBet}
              >
                <Text style={styles.btnRetryText}>🔄 CHƠI LẠI NGAY</Text>
              </TouchableOpacity>
            )}
            {gameState === "playing" && (
              <>
                {canCashOut ? (
                  <TouchableOpacity
                    style={styles.btnCashout}
                    onPress={handleCashOut}
                  >
                    <Text style={styles.btnCashoutText}>💰 CHỐT LỜI</Text>
                    <Text style={styles.btnCashoutSub}>
                      {Math.floor(
                        currentBet * MULTIPLIERS[activeRow - 1],
                      ).toLocaleString("vi-VN")}
                      đ ({MULTIPLIERS[activeRow - 1].toFixed(2)}x)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.btnHint}>
                    <Text style={styles.btnHintText}>
                      👆 Chọn ô ở tầng {activeRow + 1}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* History */}
          <View style={styles.historyPanel}>
            <Text style={styles.historyTitle}>LỊCH SỬ</Text>
            <View style={styles.histHeader}>
              <Text style={styles.histH}>Cược</Text>
              <Text style={styles.histH}>Tầng</Text>
              <Text style={styles.histH}>Hệ số</Text>
              <Text style={styles.histH}>Lời/Lỗ</Text>
            </View>
            {myBets.length === 0 && (
              <Text style={styles.histEmpty}>Chưa có lượt chơi nào</Text>
            )}
            {myBets.slice(0, 6).map((item) => {
              const win = item.profit > 0;
              return (
                <View key={item.id} style={styles.histRow}>
                  <Text style={styles.histCell}>
                    {(item.bet / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.histCell}>
                    {item.reachedFloor}/{ROWS}
                  </Text>
                  <Text
                    style={[
                      styles.histCell,
                      { color: item.cashOutMult > 0 ? "#00E676" : "#555" },
                    ]}
                  >
                    {item.cashOutMult > 0
                      ? `${item.cashOutMult.toFixed(2)}x`
                      : "💣"}
                  </Text>
                  <Text
                    style={[
                      styles.histCell,
                      {
                        color: win ? "#00E676" : "#ff4444",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {win ? "+" : ""}
                    {Math.abs(item.profit) >= 1000
                      ? `${(item.profit / 1000).toFixed(0)}k`
                      : item.profit}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GOLD = "#D4A853";
const GOLD_LT = "#FFD770";
const STONE = "#1a2235";
const STONE_DK = "#0d1422";
const ACCENT = "#4a7aff";
const GREEN = "#00c853";
const RED = "#ff3333";
const TEXT = "#e8dfc8";
const TEXT_DIM = "#7a8a9a";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: STONE_DK,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 44,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: "#0a1020",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d44",
  },
  backBtn: { padding: 8, backgroundColor: "#141e30", borderRadius: 8 },
  backBtnText: { color: TEXT_DIM, fontSize: 13 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(212,168,83,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSub: { color: TEXT_DIM, fontSize: 10, letterSpacing: 2, marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  balLabel: { color: TEXT_DIM, fontSize: 10 },
  balValue: { color: GOLD_LT, fontSize: 13, fontWeight: "bold" },

  // ── Main layout ──
  mainLayout: {
    flex: 1,
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },

  // ── Tower ──
  towerWrap: {
    flex: 1.2,
    flexDirection: "column",
    alignItems: "stretch",
  },
  towerCrown: {
    alignItems: "center",
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#0e1c0e",
    borderWidth: 1,
    borderColor: GOLD,
    borderBottomWidth: 0,
    marginBottom: -1,
    zIndex: 2,
  },
  crownText: { fontSize: 22 },
  crownLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  towerScroll: { flex: 1 },
  towerContent: {
    paddingVertical: 4,
    backgroundColor: "#0d1422",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#1e2d44",
  },

  towerBase: {
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "#0a1020",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#2a3d5a",
    marginTop: -1,
  },
  baseBar: {
    width: "80%",
    height: 3,
    backgroundColor: "#2a3d5a",
    borderRadius: 2,
    marginBottom: 4,
  },
  baseLabel: { color: TEXT_DIM, fontSize: 10 },

  // ── Floor row ──
  floorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 0,
    position: "relative",
  },
  floorMeta: {
    width: 44,
    alignItems: "center",
  },
  floorNum: {
    color: TEXT_DIM,
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  floorMult: { color: TEXT_DIM, fontSize: 9, marginTop: 1 },

  cellRow: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
    paddingVertical: 6,
  },

  connector: {
    position: "absolute",
    left: 56,
    bottom: -8,
    width: 2,
    height: 8,
    zIndex: 1,
  },
  connectorLine: {
    flex: 1,
    backgroundColor: "#1e2d44",
    borderRadius: 1,
  },

// ── Cell ──
  cell: {
    width: 54,
    height: 54,
    borderRadius: 10,
    borderWidth: 2,         
    borderStyle: 'solid',   
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',      
  },
  cellGlowRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 11,
    borderWidth: 2,
    top: -3,
    left: -3,
    zIndex: 1,
  },
  cellIcon: { fontSize: 18 },
  cellLabel: {
    color: "#00c853",
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 1,
  },

  // ── Right panel ──
  rightPanel: {
    flex: 1,
    gap: 8,
  },

  // Status card
  statusCard: {
    backgroundColor: "#0e1828",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e2d44",
    minHeight: 70,
    justifyContent: "center",
  },
  statusIdle: {
    color: TEXT_DIM,
    fontSize: 11,
    textAlign: "center",
    fontStyle: "italic",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusLabelText: { color: TEXT_DIM, fontSize: 11 },
  statusValueBlue: { color: ACCENT, fontSize: 11, fontWeight: "bold" },
  statusValueGold: { color: GOLD, fontSize: 11, fontWeight: "bold" },
  statusValueWhite: { color: TEXT, fontSize: 11, fontWeight: "bold" },
  statusValueGreen: { color: GREEN, fontSize: 11, fontWeight: "bold" },
  statusResult: { alignItems: "center", paddingVertical: 4 },
  resultIcon: { fontSize: 24 },
  resultTitle: { color: GOLD, fontSize: 14, fontWeight: "bold", marginTop: 2 },
  resultSub: { color: GREEN, fontSize: 12, marginTop: 2 },

  // Bet panel
  betPanel: {
    backgroundColor: "#0e1828",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1e2d44",
    gap: 6,
  },
  betPanelLabel: {
    color: TEXT_DIM,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "bold",
  },
  betInput: {
    backgroundColor: "#141e30",
    color: TEXT,
    padding: 8,
    borderRadius: 6,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: "#2a3d5a",
  },
  btnRow: { flexDirection: "row", gap: 4 },
  presetBtn: {
    flex: 1,
    backgroundColor: "#141e30",
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3d5a",
  },
  presetBtnText: { color: TEXT, fontSize: 10, fontWeight: "bold" },
  modBtn: {
    flex: 1,
    backgroundColor: "#0d1422",
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: "center",
  },
  modBtnText: { color: TEXT_DIM, fontSize: 10, fontWeight: "bold" },

  // Action buttons
  actionArea: { gap: 6 },
  btnStart: {
    backgroundColor: GOLD,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnStartText: {
    color: "#0a0a0a",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  btnRetry: {
    backgroundColor: "#141e30",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3d5a",
  },
  btnRetryText: { color: TEXT, fontSize: 14, fontWeight: "900" },
  btnCashout: {
    backgroundColor: GREEN,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnCashoutText: { color: "#0a1a0a", fontSize: 14, fontWeight: "900" },
  btnCashoutSub: { color: "rgba(0,30,10,0.7)", fontSize: 10, marginTop: 2 },
  btnHint: {
    backgroundColor: "#141e30",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT,
    borderStyle: "dashed",
  },
  btnHintText: { color: ACCENT, fontSize: 12, fontWeight: "600" },

  // History
  historyPanel: {
    flex: 1,
    backgroundColor: "#0a1020",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1a2535",
  },
  historyTitle: {
    color: GOLD,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 6,
  },
  histHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d44",
    paddingBottom: 4,
    marginBottom: 3,
  },
  histH: {
    flex: 1,
    color: "#3a4d62",
    fontSize: 9,
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  histRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#141e30",
  },
  histCell: { flex: 1, color: TEXT_DIM, fontSize: 10, textAlign: "center" },
  histEmpty: {
    color: "#2a3d5a",
    textAlign: "center",
    marginTop: 10,
    fontSize: 10,
    fontStyle: "italic",
  },
});
