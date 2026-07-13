import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
  FlatList,
} from 'react-native';
import api from '../services/api'; 

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatVND = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return n;
  if (Number.isInteger(num)) return num.toLocaleString('vi-VN') + ' ₫';
  return num.toLocaleString('vi-VN');
};

const CONFIG_META = {
  MIN_BET: { label: 'Mức Cược Tối Thiểu', icon: '📉', unit: '₫', type: 'currency', hint: 'Số tiền cược nhỏ nhất mỗi lượt' },
  MAX_BET: { label: 'Mức Cược Tối Đa', icon: '📈', unit: '₫', type: 'currency', hint: 'Số tiền cược lớn nhất mỗi lượt' },
  REWARD_RATIO_TAI_XIU: { label: 'Tỷ Lệ Trả Thưởng Tài/Xỉu', icon: '⚖️', unit: 'x', type: 'ratio', hint: 'Nhân hệ số khi thắng (VD: 1.98 = thắng 98%)' },
};

const GAME_SESSIONS_LIMIT = 10;

// ─── Config Card ───────────────────────────────────────────────────────────────
function ConfigCard({ config, onEdit }) {
  const meta = CONFIG_META[config.key] || { label: config.key, icon: '⚙️', unit: '', hint: config.description };
  const displayValue = meta.type === 'currency' ? formatVND(config.value) : `${config.value}${meta.unit}`;

  return (
    <View style={styles.configCard}>
      <View style={styles.configCardLeft}>
        <Text style={styles.configIcon}>{meta.icon}</Text>
        <View style={styles.configInfo}>
          <Text style={styles.configLabel}>{meta.label}</Text>
          <Text style={styles.configHint}>{meta.hint}</Text>
          <Text style={styles.configKey}>KEY: {config.key}</Text>
        </View>
      </View>
      <View style={styles.configRight}>
        <Text style={styles.configValue}>{displayValue}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(config)}>
          <Text style={styles.editBtnText}>✏️ Sửa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Edit Config Modal ─────────────────────────────────────────────────────────
function EditConfigModal({ visible, config, onClose, onSave }) {
  const [value, setValue] = useState('');
  const meta = config ? (CONFIG_META[config.key] || { label: config.key, icon: '⚙️', unit: '', hint: '' }) : {};

  useEffect(() => {
    if (config) setValue(config.value);
  }, [config]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) { Alert.alert('Lỗi', 'Giá trị không được để trống.'); return; }
    const num = parseFloat(trimmed);
    if (isNaN(num) || num <= 0) { Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ lớn hơn 0.'); return; }
    if (config.key === 'REWARD_RATIO_TAI_XIU' && (num < 1 || num > 10)) {
      Alert.alert('Lỗi', 'Tỷ lệ trả thưởng phải từ 1.0 đến 10.0'); return;
    }
    onSave(config, trimmed);
  };

  if (!config) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={editModal.overlay}>
        <View style={editModal.box}>
          <Text style={editModal.title}>{meta.icon} {meta.label}</Text>
          <Text style={editModal.hint}>{meta.hint}</Text>
          <Text style={editModal.currentLabel}>Giá trị hiện tại:</Text>
          <Text style={editModal.currentValue}>{config.value} {meta.unit}</Text>
          <Text style={editModal.inputLabel}>Giá trị mới:</Text>
          <TextInput
            style={editModal.input}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder={`Nhập ${meta.label.toLowerCase()}...`}
            placeholderTextColor="#666"
            autoFocus
          />
          {config.key === 'REWARD_RATIO_TAI_XIU' && (
            <Text style={editModal.tip}>💡 Ví dụ: 1.98 = người thắng nhận 198% tiền cược</Text>
          )}
          <View style={editModal.btnRow}>
            <TouchableOpacity style={editModal.cancelBtn} onPress={onClose}>
              <Text style={editModal.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={editModal.saveBtn} onPress={handleSave}>
              <Text style={editModal.saveText}>💾 Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Session Row ───────────────────────────────────────────────────────────────
function SessionRow({ session }) {
  const statusColor = session.status === 'COMPLETED' ? '#4CAF50' : session.status === 'BETTING' ? '#FF9800' : '#A07855';
  const resultColor = session.result === 'TAI' ? '#4CAF50' : session.result === 'XIU' ? '#FF6B35' : '#A07855';

  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionLeft}>
        <Text style={styles.sessionCode}>{session.session_code || `#${session.id}`}</Text>
        <Text style={[styles.sessionStatus, { color: statusColor }]}>{session.status}</Text>
      </View>
      <View style={styles.sessionDice}>
        {session.dice_1 != null ? (
          <Text style={styles.diceText}>🎲 {session.dice_1} · {session.dice_2} · {session.dice_3}</Text>
        ) : (
          <Text style={styles.diceText}>🎲 —</Text>
        )}
        <Text style={styles.sessionTotal}>
          {session.total_score != null ? `Tổng: ${session.total_score}` : ''}
        </Text>
      </View>
      <View style={styles.sessionRight}>
        <Text style={[styles.sessionResult, { color: resultColor }]}>
          {session.result || '—'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminGameConfig() {
  const [configs, setConfigs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('CONFIG'); // CONFIG | SESSIONS

  const fetchData = useCallback(async () => {
    try {
      const [cfgRes, sessRes] = await Promise.all([
        api.get('/system_configs'),
        api.get('/game_sessions'),
      ]);
      setConfigs(cfgRes.data);
      // Sort sessions: newest first
      const sorted = sessRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setSessions(sorted.slice(0, GAME_SESSIONS_LIMIT));
    } catch {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu cấu hình.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (config) => { setEditTarget(config); setEditVisible(true); };
  const closeEdit = () => { setEditVisible(false); setEditTarget(null); };

  const handleSave = async (config, newValue) => {
    Alert.alert(
      'Xác nhận thay đổi',
      `Cập nhật "${CONFIG_META[config.key]?.label || config.key}" thành: ${newValue}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Lưu',
          onPress: async () => {
            try {
              await api.patch(`/system_configs/${config.id}`, { value: newValue });
              setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: newValue } : c));
              closeEdit();
              Alert.alert('✅ Thành công', 'Đã cập nhật cấu hình hệ thống.');
            } catch {
              Alert.alert('Lỗi', 'Không thể cập nhật cấu hình.');
            }
          },
        },
      ]
    );
  };

  const handleCreateSession = () => {
    Alert.alert(
      '🎲 Tạo Phiên Game Mới',
      'Bạn có muốn tạo một phiên Sic Bo mới không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo phiên',
          onPress: async () => {
            try {
              // Lấy tổng số phiên thực tế từ DB để tránh trùng session_code
              const allSessionsRes = await api.get('/game_sessions');
              const totalCount = allSessionsRes.data.length;
              const newCode = `#TX${String(totalCount + 1).padStart(5, '0')}`;
              const newSession = {
                session_code: newCode,
                status: 'BETTING',
                dice_1: null, dice_2: null, dice_3: null,
                total_score: null, result: null,
                created_at: new Date().toISOString(),
              };
              const res = await api.post('/game_sessions', newSession);
              setSessions(prev => [res.data, ...prev]);
              Alert.alert('✅ Thành công', `Đã tạo phiên ${newCode}. Trạng thái: BETTING.`);
            } catch {
              Alert.alert('Lỗi', 'Không thể tạo phiên game mới.');
            }
          },
        },
      ]
    );
  };

  const handleRollDice = (session) => {
    if (session.status !== 'BETTING') {
      Alert.alert('Thông báo', 'Chỉ có thể tung xúc xắc cho phiên đang BETTING.');
      return;
    }
    Alert.alert(
      '🎲 Tung Xúc Xắc',
      `Tung xúc xắc cho phiên ${session.session_code}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tung ngay!',
          onPress: async () => {
            try {
              const d1 = Math.ceil(Math.random() * 6);
              const d2 = Math.ceil(Math.random() * 6);
              const d3 = Math.ceil(Math.random() * 6);
              const total = d1 + d2 + d3;
              const result = total >= 11 ? 'TAI' : 'XIU';

              // 1. Cập nhật trạng thái phiên game
              await api.patch(`/game_sessions/${session.id}`, {
                dice_1: d1, dice_2: d2, dice_3: d3,
                total_score: total, result,
                status: 'COMPLETED',
              });

              // 2. Lấy tất cả bets của phiên này và settle
              const betsRes = await api.get(`/bets?session_id=${session.id}`);
              const sessionBets = betsRes.data;

              // Lấy config tỷ lệ thưởng
              const cfgRes = await api.get('/system_configs');
              const ratioCfg = cfgRes.data.find(c => c.key === 'REWARD_RATIO_TAI_XIU');
              const rewardRatio = ratioCfg ? parseFloat(ratioCfg.value) : 1.98;

              // Settle từng bet và cập nhật balance người chơi
              const settlePromises = sessionBets
                .filter(b => b.status === 'PENDING')
                .map(async (bet) => {
                  const isWon = bet.bet_choice === result;
                  const winAmount = isWon ? Math.floor(bet.bet_amount * rewardRatio) : 0;
                  // Cập nhật bet
                  await api.patch(`/bets/${bet.id}`, {
                    status: isWon ? 'WON' : 'LOST',
                    win_amount: winAmount,
                  });
                  // Nếu thắng, cộng tiền cho người chơi
                  if (isWon) {
                    const userRes = await api.get(`/users/${bet.user_id}`);
                    const currentBalance = userRes.data.balance || 0;
                    await api.patch(`/users/${bet.user_id}`, {
                      balance: currentBalance + winAmount,
                    });
                  }
                });

              await Promise.all(settlePromises);

              setSessions(prev => prev.map(s =>
                s.id === session.id
                  ? { ...s, dice_1: d1, dice_2: d2, dice_3: d3, total_score: total, result, status: 'COMPLETED' }
                  : s
              ));

              const wonCount = sessionBets.filter(b => b.bet_choice === result).length;
              const lostCount = sessionBets.length - wonCount;
              Alert.alert(
                '🎲 Kết Quả',
                `Xúc xắc: ${d1} + ${d2} + ${d3} = ${total}\nKết quả: ${result === 'TAI' ? '🟢 TÀI' : '🔴 XỈU'}\n\nĐã settle: ${wonCount} thắng, ${lostCount} thua`
              );
            } catch (e) {
              console.error('Roll dice error:', e);
              Alert.alert('Lỗi', 'Không thể tung xúc xắc.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>⚙️ CẤU HÌNH GAME</Text>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CONFIG' && styles.tabActive]}
          onPress={() => setActiveTab('CONFIG')}
        >
          <Text style={[styles.tabText, activeTab === 'CONFIG' && styles.tabTextActive]}>⚙️ Cấu Hình</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'SESSIONS' && styles.tabActive]}
          onPress={() => setActiveTab('SESSIONS')}
        >
          <Text style={[styles.tabText, activeTab === 'SESSIONS' && styles.tabTextActive]}>🎲 Phiên Game</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'CONFIG' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4AF37" />}
        >
          <Text style={styles.sectionDesc}>
            Thay đổi các thông số hệ thống sẽ có hiệu lực ngay lập tức với các phiên game mới.
          </Text>
          {configs.map(cfg => (
            <ConfigCard key={cfg.id} config={cfg} onEdit={openEdit} />
          ))}

          {/* Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📊 Xem Trước Tác Động</Text>
            {(() => {
              const minBet = parseInt(configs.find(c => c.key === 'MIN_BET')?.value || '10000');
              const maxBet = parseInt(configs.find(c => c.key === 'MAX_BET')?.value || '10000000');
              const ratio = parseFloat(configs.find(c => c.key === 'REWARD_RATIO_TAI_XIU')?.value || '1.98');
              const exampleBet = 100000;
              const winAmount = Math.floor(exampleBet * ratio);
              return (
                <>
                  <PreviewRow label="Cược tối thiểu" value={formatVND(minBet)} />
                  <PreviewRow label="Cược tối đa" value={formatVND(maxBet)} />
                  <PreviewRow label="Cược 100,000 ₫ → Thắng" value={formatVND(winAmount)} accent="#4CAF50" />
                  <PreviewRow label="Lợi nhuận nhà cái / 100K" value={formatVND(exampleBet - winAmount + exampleBet)} accent="#D4AF37" />
                </>
              );
            })()}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.createSessionBtn} onPress={handleCreateSession}>
            <Text style={styles.createSessionText}>➕ Tạo Phiên Game Mới</Text>
          </TouchableOpacity>
          <FlatList
            data={sessions}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4AF37" />}
            renderItem={({ item }) => (
              <View>
                <SessionRow session={item} />
                {item.status === 'BETTING' && (
                  <TouchableOpacity style={styles.rollBtn} onPress={() => handleRollDice(item)}>
                    <Text style={styles.rollBtnText}>🎲 Tung xúc xắc cho phiên này</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Chưa có phiên game nào</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}

      <EditConfigModal
        visible={editVisible}
        config={editTarget}
        onClose={closeEdit}
        onSave={handleSave}
      />
    </View>
  );
}

function PreviewRow({ label, value, accent }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={[styles.previewValue, accent ? { color: accent } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
  center: { flex: 1, backgroundColor: '#1E0505', justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '900', color: '#D4AF37', textAlign: 'center', paddingVertical: 16 },
  loadingText: { color: '#D4AF37', marginTop: 10 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#350A0A', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#D4AF37' },
  tabText: { color: '#A07855', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#1E0505' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
  sectionDesc: { color: '#A07855', fontSize: 12, marginBottom: 16, lineHeight: 18 },
  configCard: { backgroundColor: '#350A0A', borderRadius: 14, borderWidth: 1, borderColor: '#5A2A2A', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  configCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  configIcon: { fontSize: 28, marginRight: 12, marginTop: 2 },
  configInfo: { flex: 1 },
  configLabel: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  configHint: { color: '#A07855', fontSize: 11, marginTop: 3, lineHeight: 16 },
  configKey: { color: '#5A2A2A', fontSize: 10, marginTop: 4, fontFamily: 'monospace' },
  configRight: { alignItems: 'flex-end', gap: 8 },
  configValue: { color: '#D4AF37', fontWeight: '900', fontSize: 16, textAlign: 'right' },
  editBtn: { backgroundColor: '#2A0808', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#D4AF37', fontSize: 12, fontWeight: '700' },
  previewCard: { backgroundColor: '#2A0808', borderRadius: 14, borderWidth: 1, borderColor: '#D4AF37', padding: 16, marginTop: 8 },
  previewTitle: { color: '#D4AF37', fontWeight: '900', fontSize: 15, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#350A0A' },
  previewLabel: { color: '#A07855', fontSize: 13 },
  previewValue: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  createSessionBtn: { backgroundColor: '#D4AF37', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  createSessionText: { color: '#1E0505', fontWeight: '900', fontSize: 15 },
  sessionRow: { backgroundColor: '#350A0A', borderRadius: 10, borderWidth: 1, borderColor: '#5A2A2A', marginHorizontal: 16, marginBottom: 4, padding: 12, flexDirection: 'row', alignItems: 'center' },
  sessionLeft: { width: 90 },
  sessionCode: { color: '#D4AF37', fontWeight: '700', fontSize: 12 },
  sessionStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  sessionDice: { flex: 1, alignItems: 'center' },
  diceText: { color: '#F9E596', fontSize: 13 },
  sessionTotal: { color: '#A07855', fontSize: 11, marginTop: 2 },
  sessionRight: { width: 50, alignItems: 'flex-end' },
  sessionResult: { fontWeight: '900', fontSize: 15 },
  rollBtn: { backgroundColor: '#1B3D1B', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 8, marginHorizontal: 16, marginBottom: 10, paddingVertical: 8, alignItems: 'center' },
  rollBtnText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#A07855', fontSize: 15 },
});

const editModal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: '#1E0505', borderRadius: 20, borderWidth: 2, borderColor: '#D4AF37', padding: 24 },
  title: { fontSize: 18, fontWeight: '900', color: '#D4AF37', marginBottom: 6, textAlign: 'center' },
  hint: { color: '#A07855', fontSize: 12, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  currentLabel: { color: '#A07855', fontSize: 12, marginBottom: 4 },
  currentValue: { color: '#F9E596', fontWeight: '700', fontSize: 16, marginBottom: 16 },
  inputLabel: { color: '#A07855', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#350A0A', borderRadius: 10, borderWidth: 1.5, borderColor: '#D4AF37', color: '#FFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  tip: { color: '#A07855', fontSize: 11, textAlign: 'center', marginBottom: 16, lineHeight: 16 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#350A0A', borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#5A2A2A' },
  cancelText: { color: '#A07855', fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#D4AF37', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveText: { color: '#1E0505', fontWeight: '900', fontSize: 15 },
});
