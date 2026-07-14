import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Screens
import HomeScreen from '../common/HomeScreen';
import ProfileScreen from '../account/Profile';
import DepositScreen from '../payment/Deposit';
import WithdrawScreen from '../payment/Withdraw';
import TransactionHistory from '../payment/TransactionHistory';

const Tab = createBottomTabNavigator();

// ─── Tab Icon ──────────────────────────────────────────────────────────────────
function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
  );
}

const commonOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: '#1E0505',
    borderTopColor: '#D4AF37',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 10,
    paddingTop: 5,
  },
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBarActiveTintColor: '#D4AF37',
  tabBarInactiveTintColor: '#A07855',
};

export default function MainNavigator({ route }) {
  // Lấy dữ liệu user từ Login (nếu có)
  const params = route?.params || {};

  // Bỏ Drawer và dùng chung Tab cho cả iOS và Android để app hoạt động mượt mà, không bị lỗi C++ native của Reanimated trên các dòng máy ảo / máy cũ.
  return (
    <Tab.Navigator screenOptions={commonOptions}>
      <Tab.Screen 
        name="Trang chủ" 
        component={HomeScreen} 
        initialParams={params} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen 
        name="Nạp tiền" 
        component={DepositScreen} 
        initialParams={params} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📥" focused={focused} /> }}
      />
      <Tab.Screen 
        name="Rút tiền" 
        component={WithdrawScreen} 
        initialParams={params} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📤" focused={focused} /> }}
      />
      <Tab.Screen 
        name="Lịch sử" 
        component={TransactionHistory} 
        initialParams={params} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📜" focused={focused} /> }}
      />
      <Tab.Screen 
        name="Hồ sơ" 
        component={ProfileScreen} 
        initialParams={params} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
