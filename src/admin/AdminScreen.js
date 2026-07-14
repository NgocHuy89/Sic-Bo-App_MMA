import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

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
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: '#1E0505' }}>
      <View style={[header.bar, !isPortrait && { padding: 4, marginBottom: 2 }]}>
        <View>
          <Text style={[header.title, !isPortrait && { fontSize: 14 }]}>👑 ADMIN PANEL</Text>
          <Text style={[header.sub, !isPortrait && { fontSize: 10, marginTop: 0 }]}>Xin chào, {user?.full_name || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={[header.logoutBtn, !isPortrait && { paddingHorizontal: 10, paddingVertical: 4 }]} onPress={handleLogout}>
          <Text style={[header.logoutText, !isPortrait && { fontSize: 11 }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Main Admin Screen (Tab Navigator) ────────────────────────────────────────
export default function AdminScreen({ navigation, route }) {
  const user = route?.params?.user || {};
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const tabOptions = {
    headerShown: true,
    header: () => <AdminHeader navigation={navigation} user={user} />,
    tabBarStyle: {
      backgroundColor: '#1E0505',
      borderTopColor: '#D4AF37',
      borderTopWidth: 1,
      height: isPortrait ? 60 : 50,
      paddingBottom: isPortrait ? 10 : 5,
      paddingTop: 5,
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
        name="Deposits"
        component={AdminTransactions}
        initialParams={{ user, transactionType: 'DEPOSIT' }}
        options={{
          tabBarLabel: 'Nạp tiền',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Withdraws"
        component={AdminTransactions}
        initialParams={{ user, transactionType: 'WITHDRAW' }}
        options={{
          tabBarLabel: 'Rút tiền',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📤" focused={focused} />,
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
    backgroundColor: '#350A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    padding: 10,
    marginBottom: 5,
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
    backgroundColor: '#A020F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E0505' },
});
