import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AdminDashboard from './AdminDashboard';
import AdminUserList from './AdminUserList';
import AdminTransactions from './AdminTransactions';
import AdminGameConfig from './AdminGameConfig';

const Tab = createBottomTabNavigator();

// ─── Tab Icon ──────────────────────────────────────────────────────────────────
function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
  );
}

// ─── Header with logout ────────────────────────────────────────────────────────
function AdminHeader({ navigation, user }) {
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất khỏi trang quản trị?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('logged_in_user');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={header.bar}>
      <View>
        <Text style={header.title}>👑 ADMIN PANEL</Text>
        <Text style={header.sub}>Xin chào, {user?.full_name || 'Admin'}</Text>
      </View>
      <TouchableOpacity style={header.logoutBtn} onPress={handleLogout}>
        <Text style={header.logoutText}>🚪 Xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Admin Screen (Tab Navigator) ────────────────────────────────────────
export default function AdminScreen({ navigation, route }) {
  const user = route?.params?.user || {};

  const tabOptions = {
    headerShown: true,
    header: () => <AdminHeader navigation={navigation} user={user} />,
    tabBarStyle: {
      backgroundColor: '#1E0505',
      borderTopColor: '#D4AF37',
      borderTopWidth: 1.5,
      height: 58,
      paddingBottom: 6,
      paddingTop: 4,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '700',
    },
    tabBarActiveTintColor: '#D4AF37',
    tabBarInactiveTintColor: '#5A2A2A',
  };

  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Thống kê',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUserList}
        options={{
          tabBarLabel: 'Người dùng',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={AdminTransactions}
        initialParams={{ user }}
        options={{
          tabBarLabel: 'Giao dịch',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="GameConfig"
        component={AdminGameConfig}
        options={{
          tabBarLabel: 'Cấu hình',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const header = StyleSheet.create({
  bar: {
    backgroundColor: '#1E0505',
    borderBottomWidth: 1.5,
    borderBottomColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D4AF37',
  },
  sub: {
    fontSize: 12,
    color: '#A07855',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#350A0A',
    borderWidth: 1,
    borderColor: '#7B1C1C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#FF4444',
    fontWeight: '700',
    fontSize: 13,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
});
