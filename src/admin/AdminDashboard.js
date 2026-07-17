import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../services/api';

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data, maxValue, color = '#D4AF37' }) {
  if (!data || data.length === 0) return null;
  return (
    <View style={chart.container}>
      {data.map((item, idx) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <View key={idx} style={chart.barGroup}>
            <Text style={chart.barValue}>{formatShort(item.value)}</Text>
            <View style={chart.barBg}>
              <View style={[chart.barFill, { height: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={chart.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function formatShort(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function formatVND(n) {
  return n?.toLocaleString('vi-VN') + ' ₫';
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <View style={[card.box, { borderColor: accent || '#D4AF37' }]}>
      <Text style={[card.value, { color: accent || '#D4AF37' }]}>{value}</Text>
      <Text style={card.label}>{label}</Text>
      {sub ? <Text style={card.sub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, txRes, sessionsRes, betsRes] = await Promise.all([
        api.get('/users'),
        api.get('/transactions'),
        api.get('/game_sessions'),
        api.get('/bets'),
      ]);

      const users = usersRes.data;
      const transactions = txRes.data;
      const sessions = sessionsRes.data;
      const bets = betsRes.data;

      // Users
      const totalUsers = users.filter(u => u.role === 'CUSTOMER').length;
      const activeUsers = users.filter(u => u.role === 'CUSTOMER' && u.status === 'ACTIVE').length;
      const totalBalance = users.reduce((s, u) => s + (u.balance || 0), 0);
      const topUsers = [...users]
        .filter(u => u.role === 'CUSTOMER')
        .sort((a, b) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 10);

      // Transactions
      const pendingTx = transactions.filter(t => t.status === 'PENDING').length;
      const approvedDeposits = transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'APPROVED');
      const totalDeposited = approvedDeposits.reduce((s, t) => s + (t.amount || 0), 0);
      const approvedWithdraws = transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'APPROVED');
      const totalWithdrawn = approvedWithdraws.reduce((s, t) => s + (t.amount || 0), 0);

      // Game sessions
      const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
      const taiCount = sessions.filter(s => s.result === 'TAI').length;
      const xiuCount = sessions.filter(s => s.result === 'XIU').length;

      // Bets — chỉ tính các bet đã settle (WON hoặc LOST), bỏ qua PENDING
      const settledBets = bets.filter(b => b.status === 'WON' || b.status === 'LOST');
      const totalBetAmount = settledBets.reduce((s, b) => s + (b.bet_amount || 0), 0);
      const totalWinAmount = settledBets.filter(b => b.status === 'WON').reduce((s, b) => s + (b.win_amount || 0), 0);
      const wonBets = settledBets.filter(b => b.status === 'WON').length;
      const lostBets = settledBets.filter(b => b.status === 'LOST').length;

      // Chart: last 5 sessions bet volume
      const last5Sessions = sessions.slice(-5);
      const sessionChart = last5Sessions.map(s => {
        const sessionBets = bets.filter(b => b.session_id === s.id);
        const vol = sessionBets.reduce((sum, b) => sum + (b.bet_amount || 0), 0);
        return { label: s.session_code?.replace('#TX', 'TX') || s.id, value: vol };
      });
      const maxVol = Math.max(...sessionChart.map(d => d.value), 1);

      setStats({
        totalUsers, activeUsers, totalBalance,
        pendingTx, totalDeposited, totalWithdrawn,
        completedSessions, taiCount, xiuCount,
        totalBetAmount, totalWinAmount, wonBets, lostBets,
        sessionChart, maxVol,
        houseProfit: totalBetAmount - totalWinAmount,
        topUsers,
      });
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không thể tải dữ liệu</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
    >
      <Text style={styles.pageTitle}>📊 DASHBOARD THỐNG KÊ</Text>

      {/* ── Section: Người dùng ── */}
      <SectionHeader title="👥 Người Dùng" />
      <View style={styles.row}>
        <StatCard label="Tổng người chơi" value={stats.totalUsers} accent="#D4AF37" />
        <StatCard label="Đang hoạt động" value={stats.activeUsers} accent="#4CAF50" />
      </View>
      <View style={styles.row}>
        <StatCard
          label="Tổng số dư hệ thống"
          value={formatVND(stats.totalBalance)}
          accent="#F9E596"
        />
        <StatCard
          label="Giao dịch chờ duyệt"
          value={stats.pendingTx}
          accent={stats.pendingTx > 0 ? '#FF6B35' : '#4CAF50'}
          sub={stats.pendingTx > 0 ? '⚠ Cần xử lý' : '✓ Đã xử lý hết'}
        />
      </View>

      {/* ── Section: Tài chính ── */}
      <SectionHeader title="💰 Tài Chính" />
      <View style={styles.row}>
        <StatCard label="Tổng nạp (đã duyệt)" value={formatVND(stats.totalDeposited)} accent="#4CAF50" />
        <StatCard label="Tổng rút (đã duyệt)" value={formatVND(stats.totalWithdrawn)} accent="#FF6B35" />
      </View>
      <View style={styles.row}>
        <StatCard
          label="Lợi nhuận nhà cái"
          value={formatVND(stats.houseProfit)}
          accent={stats.houseProfit >= 0 ? '#D4AF37' : '#FF4444'}
        />
      </View>

      {/* ── Section: Game ── */}
      <SectionHeader title="🎲 Thống Kê Game" />
      <View style={styles.row}>
        <StatCard label="Phiên hoàn thành" value={stats.completedSessions} accent="#D4AF37" />
        <StatCard label="Tổng tiền cược" value={formatVND(stats.totalBetAmount)} accent="#F9E596" />
      </View>
      <View style={styles.row}>
        <StatCard label="Kết quả TÀI" value={stats.taiCount} accent="#4CAF50" />
        <StatCard label="Kết quả XỈU" value={stats.xiuCount} accent="#FF6B35" />
      </View>
      <View style={styles.row}>
        <StatCard label="Lượt thắng" value={stats.wonBets} accent="#4CAF50" />
        <StatCard label="Lượt thua" value={stats.lostBets} accent="#FF4444" />
      </View>

      {/* ── Section: Biểu đồ ── */}
      <SectionHeader title="📈 Khối Lượng Cược (5 Phiên Gần Nhất)" />
      <View style={styles.chartCard}>
        {stats.sessionChart.length > 0 ? (
          <BarChart data={stats.sessionChart} maxValue={stats.maxVol} color="#D4AF37" />
        ) : (
          <Text style={styles.noData}>Chưa có dữ liệu phiên game</Text>
        )}
      </View>

      {/* ── Section: Tỷ lệ Tài/Xỉu ── */}
      <SectionHeader title="⚖️ Tỷ Lệ Kết Quả" />
      <View style={styles.chartCard}>
        <RatioBar
          leftLabel="TÀI"
          leftCount={stats.taiCount}
          rightLabel="XỈU"
          rightCount={stats.xiuCount}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ─── Ratio Bar ─────────────────────────────────────────────────────────────────
function RatioBar({ leftLabel, leftCount, rightLabel, rightCount }) {
  const total = leftCount + rightCount;
  const leftPct = total > 0 ? Math.round((leftCount / total) * 100) : 50;
  const rightPct = 100 - leftPct;
  return (
    <View> 
      <View style={ratio.bar}>
        <View style={[ratio.left, { flex: leftPct }]} />
        <View style={[ratio.right, { flex: rightPct }]} />
      </View>
      <View style={ratio.labels}>
        <Text style={[ratio.label, { color: '#4CAF50' }]}>{leftLabel}: {leftCount} ({leftPct}%)</Text>
        <Text style={[ratio.label, { color: '#FF6B35' }]}>{rightLabel}: {rightCount} ({rightPct}%)</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
  content: { padding: 16 },
  center: { flex: 1, backgroundColor: '#1E0505', justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 16, fontWeight: '900', color: '#D4AF37', textAlign: 'center', marginBottom: 12, marginTop: 6 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#F9E596', marginTop: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#D4AF37', paddingLeft: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  chartCard: { backgroundColor: '#350A0A', borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37', padding: 16, marginBottom: 4 },
  noData: { color: '#A07855', textAlign: 'center', fontSize: 14 },
  loadingText: { color: '#D4AF37', marginTop: 12, fontSize: 14 },
  errorText: { color: '#FF4444', fontSize: 16, marginBottom: 16 },
  retryBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#1E0505', fontWeight: 'bold' },
  topUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2A0808' },
  topUserRank: { color: '#D4AF37', fontSize: 14, fontWeight: '900', width: 30 },
  topUserName: { color: '#F9E596', fontSize: 14, flex: 1, marginLeft: 8 },
  topUserBalance: { color: '#4CAF50', fontSize: 14, fontWeight: '700' },
});

const card = StyleSheet.create({
  box: { flex: 1, backgroundColor: '#350A0A', borderRadius: 12, borderWidth: 1.5, padding: 14, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  label: { fontSize: 11, color: '#A07855', marginTop: 4, textAlign: 'center' },
  sub: { fontSize: 10, color: '#F9E596', marginTop: 2, textAlign: 'center' },
});

const chart = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, justifyContent: 'space-around' },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barBg: { width: '70%', height: 90, backgroundColor: '#2A0808', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barValue: { fontSize: 9, color: '#F9E596', marginBottom: 2 },
  barLabel: { fontSize: 9, color: '#A07855', marginTop: 4, textAlign: 'center' },
});

const ratio = StyleSheet.create({
  bar: { flexDirection: 'row', height: 28, borderRadius: 14, overflow: 'hidden' },
  left: { backgroundColor: '#4CAF50' },
  right: { backgroundColor: '#FF6B35' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { fontSize: 13, fontWeight: '700' },
});
