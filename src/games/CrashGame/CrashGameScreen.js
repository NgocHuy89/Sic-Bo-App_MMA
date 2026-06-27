/**
 * CrashGameScreen.jsx
 * 
 * Thay đổi so với bản gốc:
 * 1. Phiên chơi liên tiếp tự động (waiting → flying → crashed → waiting...)
 *    Người dùng đặt/hủy cược trong giai đoạn "waiting"
 * 2. Lịch sử cược đầy đủ: Cược | Chốt | Nổ | Lời/Lỗ
 * 3. Giao diện chuẩn Aviator: 
 *    - 1 giây đầu máy bay trượt vào vị trí cố định (góc trên phải).
 *    - Sau đó máy bay đứng im, trục tọa độ Y giãn ra, đường Line (Trail) trôi ngược lại để tạo ảo giác tốc độ bay.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, FlatList, useWindowDimensions, Animated, Easing,
} from 'react-native';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const COUNTDOWN_SECS = 5;        // giây chờ giữa các phiên
const PLANE_ENTRY_MS = 1000;     // ms máy bay trượt vào vị trí
const K = 0.00025;               // tốc độ tăng multiplier: mult = e^(K*t)
const MAX_TRAIL_DOTS = 120;      // số điểm tối đa trong trail

const computeMult = (ms) => Math.pow(Math.E, K * ms);

const generateCrashPoint = () => {
  // house edge ~1%
  const r = Math.random();
  const crash = 0.99 / r;
  return Math.max(1.0, parseFloat(crash.toFixed(2)));
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CrashGameScreen({ navigation, route }) {
  const initialBalance = route?.params?.currentBalance ?? 500_000;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [balance,     setBalance]     = useState(initialBalance);
  const [betAmount,   setBetAmount]   = useState('10000');
  const [multiplier,  setMultiplier]  = useState(1.00);
  const [phase,       setPhase]       = useState('waiting');   // 'waiting'|'flying'|'crashed'
  const [countdown,   setCountdown]   = useState(COUNTDOWN_SECS);
  const [betPlaced,   setBetPlaced]   = useState(false);
  const [hasCashedOut,setHasCashedOut]= useState(false);
  const [pendingBet,  setPendingBet]  = useState(0);
  const [crashHistory,setCrashHistory]= useState([]);
  const [myBets,      setMyBets]      = useState([]);
  const [trailDots,   setTrailDots]   = useState([]);  // [{x,y}]

  // ── Refs (to read inside closures without stale state) ──────────────────────
  const phaseRef          = useRef('waiting');
  const hasCashedOutRef   = useRef(false);
  const pendingBetRef     = useRef(0);
  const multiplierRef     = useRef(1.00);
  const crashPointRef     = useRef(2.0);
  const sessionRef        = useRef(0);
  const betAmountRef      = useRef('10000');
  const boardRef          = useRef({ w: 300, h: 200 });
  const flyStartRef       = useRef(0);
  const planeMoveDoneRef  = useRef(false);
  const rafRef            = useRef(null);
  const trailDotsRef      = useRef([]);

  const syncPhase = (p) => { setPhase(p); phaseRef.current = p; };

  useEffect(() => { hasCashedOutRef.current = hasCashedOut; }, [hasCashedOut]);
  useEffect(() => { pendingBetRef.current   = pendingBet;   }, [pendingBet]);
  useEffect(() => { multiplierRef.current   = multiplier;   }, [multiplier]);
  useEffect(() => { betAmountRef.current    = betAmount;    }, [betAmount]);

  // ── Animated values ─────────────────────────────────────────────────────────
  const planeLeft = useRef(new Animated.Value(0)).current;
  const planeTop  = useRef(new Animated.Value(0)).current;

  // ── Countdown (waiting phase) ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'waiting') return;
    setCountdown(COUNTDOWN_SECS);
    trailDotsRef.current = [];
    setTrailDots([]);
    let c = COUNTDOWN_SECS;
    const timer = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(timer);
        beginFlight();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // ── Begin flight ─────────────────────────────────────────────────────────────
  const beginFlight = useCallback(() => {
    const sid = ++sessionRef.current;
    const cp  = generateCrashPoint();
    crashPointRef.current  = cp;
    planeMoveDoneRef.current = false;
    flyStartRef.current    = Date.now();
    trailDotsRef.current   = [];

    setMultiplier(1.00);
    multiplierRef.current = 1.00;
    syncPhase('flying');

    const { w, h } = boardRef.current;
    // Plane start (just off left) → rest position
    const startX = -10, startY = h * 0.85;
    const restX  = w * 0.75, restY = h * 0.25;

    planeLeft.setValue(startX);
    planeTop.setValue(startY);

    // Entry animation (bay lên góc phải trong 1s)
    Animated.parallel([
      Animated.timing(planeLeft, { toValue: restX, duration: PLANE_ENTRY_MS, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(planeTop,  { toValue: restY, duration: PLANE_ENTRY_MS, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start(() => { planeMoveDoneRef.current = true; });

    // Game tick
    const tick = () => {
      if (phaseRef.current !== 'flying' || sessionRef.current !== sid) return;

      const elapsed = Date.now() - flyStartRef.current;
      const m = computeMult(elapsed);
      setMultiplier(m);
      multiplierRef.current = m;

      // ── LOGIC MỚI: TÍNH TOÁN ĐƯỜNG TRAIL VÀ CỐ ĐỊNH MÁY BAY ──
      const { w: bw, h: bh } = boardRef.current;
      
      if (planeMoveDoneRef.current) {
        // Giai đoạn 2: Máy bay đứng im, Trail bị kéo trôi ngược về sau và xuống dưới
        planeLeft.setValue(restX);
        planeTop.setValue(restY);

        const speedX = 0.8; // Tốc độ trôi ngang
        const speedY = 0.4; // Tốc độ trôi dọc xuống
        
        const next = trailDotsRef.current.map(d => ({
          x: d.x - speedX,
          y: d.y + speedY
        })).filter(d => d.x > -50 && d.y < bh + 50); // Xóa rác khỏi bộ nhớ khi điểm đã văng ra ngoài màn hình

        // Neo điểm đầu tiên của đuôi vào đít máy bay
        next.push({ x: restX, y: restY });
        
        trailDotsRef.current = next;
        setTrailDots([...next]);
      } else {
        // Giai đoạn 1 (0-1s): Máy bay đang di chuyển, vẽ trail bám theo đuôi
        const prog = Math.min(elapsed / PLANE_ENTRY_MS, 1);
        const easeProg = 1 - (1 - prog) * (1 - prog); // Mô phỏng Easing.out(quad)
        const currX = startX + (restX - startX) * easeProg;
        const currY = startY + (restY - startY) * easeProg;

        const prev = trailDotsRef.current;
        const lastDot = prev[prev.length - 1];
        const dx = lastDot ? Math.abs(currX - lastDot.x) : 999;
        
        if (dx > 2 || !lastDot) {
          const next = [...prev, { x: currX, y: currY }];
          if (next.length > MAX_TRAIL_DOTS) next.shift();
          trailDotsRef.current = next;
          setTrailDots([...next]);
        }
      }

      if (m >= cp) {
        doCrash(sid, cp);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Crash ────────────────────────────────────────────────────────────────────
  const doCrash = useCallback((sid, finalMult) => {
    cancelAnimationFrame(rafRef.current);
    const fm = parseFloat(finalMult.toFixed(2));
    setMultiplier(fm);
    multiplierRef.current = fm;
    syncPhase('crashed');

    setCrashHistory(prev => [fm, ...prev].slice(0, 20));

    // Record loss if bet was not cashed out
    if (pendingBetRef.current > 0 && !hasCashedOutRef.current) {
      const bet = pendingBetRef.current;
      setMyBets(prev => [{
        id: `${Date.now()}`,
        betAmount: bet,
        cashOutMult: 0,
        crashMult: fm,
        profit: -bet,
      }, ...prev].slice(0, 50));
    }

    setBetPlaced(false);
    setHasCashedOut(false); hasCashedOutRef.current = false;
    setPendingBet(0);       pendingBetRef.current   = 0;

    setTimeout(() => {
      if (sessionRef.current === sid) syncPhase('waiting');
    }, 2800);
  }, []);

  // ── Place / cancel bet ───────────────────────────────────────────────────────
  const handlePlaceBet = () => {
    if (phase !== 'waiting' || betPlaced) return;
    const bet = parseInt(betAmountRef.current);
    if (!bet || bet <= 0 || bet > balance) {
      Alert.alert('Lỗi', 'Số tiền cược không hợp lệ hoặc không đủ số dư!');
      return;
    }
    setBalance(b => b - bet);
    setPendingBet(bet); pendingBetRef.current = bet;
    setBetPlaced(true);
  };

  const handleCancelBet = () => {
    if (phase !== 'waiting' || !betPlaced) return;
    setBalance(b => b + pendingBet);
    setPendingBet(0); pendingBetRef.current = 0;
    setBetPlaced(false);
  };

  // ── Cash out ─────────────────────────────────────────────────────────────────
  const handleCashOut = () => {
    if (phase !== 'flying' || hasCashedOutRef.current || !pendingBetRef.current) return;
    const bet    = pendingBetRef.current;
    const mult   = multiplierRef.current;
    const reward = Math.floor(bet * mult);
    const profit = reward - bet;

    setBalance(b => b + reward);
    setHasCashedOut(true); hasCashedOutRef.current = true;

    setMyBets(prev => [{
      id: `${Date.now()}`,
      betAmount: bet,
      cashOutMult: parseFloat(mult.toFixed(2)),
      crashMult: crashPointRef.current,
      profit,
    }, ...prev].slice(0, 50));

    setPendingBet(0); pendingBetRef.current = 0;
  };

  // ── Bet adjustments ──────────────────────────────────────────────────────────
  const adjustBet = (action, value) => {
    if (phase === 'flying' || betPlaced) return;
    let v = parseInt(betAmount) || 0;
    if (action === 'set') v = value;
    else if (action === 'add') v += value;
    else if (action === 'sub') v -= value;
    else if (action === 'mul') v *= value;
    else if (action === 'div') v = Math.floor(v / value);
    v = Math.max(0, Math.min(v, balance));
    setBetAmount(String(v));
    betAmountRef.current = String(v);
  };

  // ── Render trail ─────────────────────────────────────────────────────────────
  const renderTrail = () => {
    if (phase === 'waiting' || trailDots.length < 2) return null;
    const color = phase === 'crashed' ? '#ff4444' : '#e94560'; // Màu đỏ rực của trail

    return trailDots.map((dot, i) => {
      if (i === 0) return null;
      const prev = trailDots[i - 1];
      const dx   = dot.x - prev.x;
      const dy   = dot.y - prev.y;
      const len  = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const alpha = 0.15 + (i / trailDots.length) * 0.85;

      return (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: prev.x,
            top: prev.y,
            width: len,
            height: i === trailDots.length - 1 ? 4 : 2, // Đuôi dày hơn ở mũi
            backgroundColor: color,
            opacity: alpha,
            transformOrigin: 'left center',
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      );
    });
  };

  // ── Render game board ────────────────────────────────────────────────────────
  const multColor = phase === 'crashed' ? '#ff4444'
    : hasCashedOut ? '#FFD700'
    : '#00E676';

  const renderGameBoard = () => (
    <View
      style={styles.gameBoard}
      onLayout={e => {
        boardRef.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
      }}
    >
      {/* ── LOGIC MỚI: Grid (Trục Y) co giãn dựa trên độ cao của số X ── */}
      <View style={StyleSheet.absoluteFill}>
        {[0.2, 0.5, 0.8].map((frac, i) => {
          // multiplier càng to, các vạch grid càng giãn số to ra để lấp đầy màn hình
          const gridVal = (multiplier > 1.5 ? multiplier * (1 - frac) : 1 + (1 - frac) * 0.5).toFixed(2);
          return (
            <View key={i} style={[styles.gridLine, { top: `${frac * 100}%` }]}>
              <Text style={styles.gridLabel}>{Math.max(1.0, gridVal)}x</Text>
            </View>
          );
        })}
      </View>

      {/* Trail Area */}
      {renderTrail()}

      {/* Waiting overlay */}
      {phase === 'waiting' && (
        <View style={styles.waitingOverlay}>
          <Text style={styles.waitingLabel}>Phiên mới bắt đầu sau</Text>
          <Text style={styles.countdownNum}>{countdown}</Text>
          {betPlaced && (
            <View style={styles.betConfirmedBadge}>
              <Text style={styles.betConfirmedText}>
                ✓ Đã đặt {(pendingBet / 1000).toFixed(0)}k · Đang chờ...
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Crashed banner */}
      {phase === 'crashed' && (
        <Text style={styles.crashBanner}>💥 MÁY BAY NỔ!</Text>
      )}

      {/* Cashed out badge */}
      {phase === 'flying' && hasCashedOut && (
        <View style={styles.cashedOutBadge}>
          <Text style={styles.cashedOutText}>✓ Đã chốt lời an toàn</Text>
        </View>
      )}

      {/* Multiplier */}
      <Text style={[styles.multiplierText, isLandscape && { fontSize: 38 }, { color: multColor }]}>
        {multiplier.toFixed(2)}x
      </Text>

      {/* Plane */}
      {phase !== 'waiting' && (
        <Animated.View style={[styles.planeWrapper, { left: planeLeft, top: planeTop }]}>
          {phase === 'crashed'
            ? <Text style={styles.explosionIcon}>💥</Text>
            : <Text style={styles.planeIcon}>✈️</Text>
          }
        </Animated.View>
      )}
    </View>
  );

  // ── Render bet controls ──────────────────────────────────────────────────────
  const canEdit  = phase === 'waiting' && !betPlaced;
  const potWin   = Math.floor((parseInt(betAmount) || 0) * multiplier);

  const renderBetControl = () => (
    <View style={styles.betControlSection}>
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Tiền cược:</Text>
        <TextInput
          style={[styles.input, !canEdit && { opacity: 0.4 }]}
          keyboardType="numeric"
          value={betAmount}
          onChangeText={t => { setBetAmount(t); betAmountRef.current = t; }}
          editable={canEdit}
        />
      </View>

      <View style={styles.btnRow}>
        {[[5000,'5k'],[20000,'20k'],[50000,'50k'],[100000,'100k']].map(([v, l]) => (
          <TouchableOpacity
            key={l}
            style={[styles.miniBtn, !canEdit && styles.btnDimmed]}
            onPress={() => adjustBet('set', v)}
            disabled={!canEdit}
          >
            <Text style={styles.miniBtnText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.btnRow}>
        {[['-5k','sub',5000],['+5k','add',5000],['/2','div',2],['x2','mul',2]].map(([l,a,v]) => (
          <TouchableOpacity
            key={l}
            style={[styles.modifyBtn, !canEdit && styles.btnDimmed]}
            onPress={() => adjustBet(a, v)}
            disabled={!canEdit}
          >
            <Text style={styles.miniBtnText}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Primary action */}
      {phase === 'waiting' && !betPlaced && (
        <TouchableOpacity style={[styles.mainBtn, styles.btnBet]} onPress={handlePlaceBet}>
          <Text style={styles.mainBtnText}>ĐẶT CƯỢC</Text>
          <Text style={styles.mainBtnSub}>Phiên bắt đầu sau {countdown}s</Text>
        </TouchableOpacity>
      )}
      {phase === 'waiting' && betPlaced && (
        <TouchableOpacity style={[styles.mainBtn, styles.btnCancel]} onPress={handleCancelBet}>
          <Text style={styles.mainBtnText}>HỦY CƯỢC</Text>
          <Text style={styles.mainBtnSub}>Đã đặt {(pendingBet/1000).toFixed(0)}k · Chờ phiên mới</Text>
        </TouchableOpacity>
      )}
      {phase === 'flying' && !hasCashedOut && pendingBet > 0 && (
        <TouchableOpacity style={[styles.mainBtn, styles.btnCashout]} onPress={handleCashOut}>
          <Text style={[styles.mainBtnText, { color: '#0a1628' }]}>CHỐT LỜI</Text>
          <Text style={[styles.mainBtnSub, { color: '#0a1628' }]}>
            Thu về {Math.floor(pendingBet * multiplier).toLocaleString('vi-VN')} đ
          </Text>
        </TouchableOpacity>
      )}
      {phase === 'flying' && hasCashedOut && (
        <View style={[styles.mainBtn, { backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#00E676' }]}>
          <Text style={[styles.mainBtnText, { color: '#00E676' }]}>✓ ĐÃ CHỐT LỜI</Text>
        </View>
      )}
      {phase === 'flying' && !pendingBet && !hasCashedOut && (
        <View style={[styles.mainBtn, { backgroundColor: '#1a1a30' }]}>
          <Text style={[styles.mainBtnText, { color: '#444' }]}>ĐANG BAY — Không cược phiên này</Text>
        </View>
      )}
      {phase === 'crashed' && (
        <View style={[styles.mainBtn, { backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: '#ff4444' }]}>
          <Text style={[styles.mainBtnText, { color: '#ff6b6b' }]}>💥 Chờ phiên mới...</Text>
        </View>
      )}
    </View>
  );

  // ── Render history ───────────────────────────────────────────────────────────
  const renderHistory = () => (
    <View style={styles.historySection}>
      <Text style={styles.panelTitle}>LỊCH SỬ CƯỢC CỦA BẠN</Text>
      <View style={styles.tableHeader}>
        {['Cược', 'Tỉ lệ chốt', 'Tỉ lệ nổ', 'Tiền lời'].map(h => (
          <Text key={h} style={styles.tableHeaderText}>{h}</Text>
        ))}
      </View>
      <FlatList
        data={myBets}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có lịch sử cược</Text>}
        renderItem={({ item }) => {
          const win = item.profit > 0;
          return (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>{(item.betAmount/1000).toFixed(0)}k</Text>
              <Text style={[styles.cell, { color: item.cashOutMult > 0 ? '#00E676' : '#555' }]}>
                {item.cashOutMult > 0 ? `${item.cashOutMult.toFixed(2)}x` : '—'}
              </Text>
              <Text style={[styles.cell, { color: '#ff6b6b' }]}>{item.crashMult.toFixed(2)}x</Text>
              <Text style={[styles.cell, { color: win ? '#00E676' : '#ff4444', fontWeight: 'bold' }]}>
                {win ? '+' : ''}
                {Math.abs(item.profit) >= 1000
                  ? `${(item.profit/1000).toFixed(0)}k`
                  : item.profit}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );

  // ── Root ─────────────────────────────────────────────────────────────────────
  const phaseLabel = phase === 'waiting'
    ? `⏳ Chờ · ${countdown}s`
    : phase === 'flying' ? '🚀 Đang bay'
    : '💥 Đã nổ';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, isLandscape && { marginTop: 4, paddingVertical: 6 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={phase === 'flying'}
        >
          <Text style={[styles.backBtnText, phase === 'flying' && { opacity: 0.4 }]}>{'< Thoát'}</Text>
        </TouchableOpacity>
        <Text style={styles.phasePill}>{phaseLabel}</Text>
        <Text style={styles.balanceText}>💰 {balance.toLocaleString('vi-VN')} đ</Text>
      </View>

      {/* Crash strip */}
      <View style={[styles.stripWrap, isLandscape && { height: 26, marginTop: 4 }]}>
        <FlatList
          horizontal
          data={crashHistory}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={[styles.crashBadge, { borderColor: item >= 2 ? '#00E676' : '#ff4444' }]}>
              <Text style={[styles.crashBadgeText, { color: item >= 2 ? '#00E676' : '#ff4444' }]}>
                {item.toFixed(2)}x
              </Text>
            </View>
          )}
        />
      </View>

      {isLandscape ? (
        <View style={styles.landscapeWrap}>
          <View style={{ flex: 1.4 }}>{renderGameBoard()}</View>
          <View style={{ flex: 1, gap: 6 }}>
            {renderBetControl()}
            {renderHistory()}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {renderGameBoard()}
          {renderBetControl()}
          {renderHistory()}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d1a', padding: 10 },

  header: {
    marginTop: 30, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#13132a', borderRadius: 10,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#252550',
  },
  backBtn: { paddingVertical: 5, paddingHorizontal: 10, backgroundColor: '#1e1e40', borderRadius: 6 },
  backBtnText: { color: '#aaa', fontWeight: 'bold', fontSize: 12 },
  phasePill: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  balanceText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },

  stripWrap: { height: 34, marginTop: 8 },
  crashBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    marginRight: 6, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  crashBadgeText: { fontWeight: 'bold', fontSize: 11 },

  // Game board
  gameBoard: {
    flex: 1.6, width: '100%',
    backgroundColor: '#080e1d',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#1c2745',
    minHeight: 190, overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.055)', borderStyle: 'dashed',
  },
  gridLabel: {
    position: 'absolute', left: 8, top: -15,
    color: 'rgba(255,255,255,0.22)', fontSize: 10, fontFamily: 'monospace',
  },

  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    backgroundColor: 'rgba(8,14,29,0.7)',
  },
  waitingLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  countdownNum: {
    color: '#FFD700', fontSize: 58, fontWeight: '900', fontFamily: 'monospace',
    textShadowColor: 'rgba(255,215,0,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
  },
  betConfirmedBadge: {
    marginTop: 10, backgroundColor: 'rgba(0,230,118,0.15)',
    borderWidth: 1, borderColor: '#00E676',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  betConfirmedText: { color: '#00E676', fontWeight: 'bold', fontSize: 12 },

  crashBanner: {
    position: 'absolute', top: 14, alignSelf: 'center',
    color: '#ff4444', fontSize: 20, fontWeight: 'bold', zIndex: 10,
    textShadowColor: 'rgba(255,68,68,0.5)', textShadowOffset: {width:0,height:0}, textShadowRadius: 12,
  },
  cashedOutBadge: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: 'rgba(0,230,118,0.15)', borderWidth: 1, borderColor: '#00E676',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, zIndex: 5,
  },
  cashedOutText: { color: '#00E676', fontWeight: 'bold', fontSize: 12 },

  multiplierText: {
    fontSize: 52, fontWeight: '900', fontFamily: 'monospace',
    position: 'absolute', bottom: '28%', alignSelf: 'center', zIndex: 2,
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },

  planeWrapper: { position: 'absolute', zIndex: 5 },
  planeIcon: { fontSize: 34, transform: [{ rotate: '-12deg' }] },
  explosionIcon: { fontSize: 38 },

  // Bet controls
  betControlSection: {
    backgroundColor: '#13132a', borderRadius: 10,
    padding: 10, marginTop: 8,
    borderWidth: 1, borderColor: '#252550',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { color: '#999', fontSize: 12, fontWeight: 'bold', marginRight: 8, width: 72 },
  input: {
    flex: 1, backgroundColor: '#1c1c38', color: '#fff',
    padding: 7, borderRadius: 6, fontSize: 14,
    textAlign: 'center', fontWeight: 'bold',
    borderWidth: 1, borderColor: '#353565',
  },
  btnRow: { flexDirection: 'row', gap: 4, marginBottom: 5 },
  miniBtn: {
    flex: 1, backgroundColor: '#1c1c38', paddingVertical: 8,
    borderRadius: 5, alignItems: 'center',
    borderWidth: 1, borderColor: '#353565',
  },
  modifyBtn: { flex: 1, backgroundColor: '#191930', paddingVertical: 8, borderRadius: 5, alignItems: 'center' },
  btnDimmed: { opacity: 0.35 },
  miniBtnText: { color: '#ccc', fontSize: 11, fontWeight: 'bold' },

  mainBtn: {
    padding: 11, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, minHeight: 46,
  },
  btnBet:     { backgroundColor: '#c0293e' },
  btnCancel:  { backgroundColor: '#5a2e00' },
  btnCashout: { backgroundColor: '#00E676' },
  mainBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.8 },
  mainBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },

  // History
  historySection: {
    flex: 1.4, backgroundColor: '#0a0a18',
    borderRadius: 10, padding: 8, marginTop: 8,
    borderWidth: 1, borderColor: '#252540',
  },
  panelTitle: {
    color: '#D4AF37', fontSize: 10, fontWeight: 'bold',
    textAlign: 'center', letterSpacing: 1.5, marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: '#252540', paddingBottom: 5, marginBottom: 3,
  },
  tableHeaderText: {
    flex: 1, color: '#555', fontSize: 10,
    textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 5,
    borderBottomWidth: 0.5, borderBottomColor: '#18182e',
  },
  cell: { flex: 1, color: '#ccc', fontSize: 11, textAlign: 'center' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 14, fontSize: 11, fontStyle: 'italic' },

  landscapeWrap: { flex: 1, flexDirection: 'row', marginTop: 6, gap: 8 },
});