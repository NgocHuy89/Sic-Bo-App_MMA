import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from '../common/HomeScreen';
import ProfileScreen from '../account/Profile';
import DepositScreen from '../payment/Deposit';
import WithdrawScreen from '../payment/Withdraw';

const Tab = createBottomTabNavigator();

const commonOptions = {
  headerStyle: {
    backgroundColor: '#350A0A',
  },
  headerTintColor: '#D4AF37',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  tabBarStyle: {
    backgroundColor: '#1E0505',
    borderTopColor: '#D4AF37',
    borderTopWidth: 1,
  },
  tabBarActiveTintColor: '#D4AF37',
  tabBarInactiveTintColor: '#A07855',
};

export default function MainNavigator() {
  // Bỏ Drawer và dùng chung Tab cho cả iOS và Android để app hoạt động mượt mà, không bị lỗi C++ native của Reanimated trên các dòng máy ảo / máy cũ.
  return (
    <Tab.Navigator screenOptions={commonOptions}>
      <Tab.Screen name="Trang chủ" component={HomeScreen} />
      <Tab.Screen name="Nạp tiền" component={DepositScreen} />
      <Tab.Screen name="Rút tiền" component={WithdrawScreen} />
      <Tab.Screen name="Hồ sơ" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
