import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

import LoginScreen from './src/authentication/Login';
import RegisterScreen from './src/authentication/Register';
import MainNavigator from './src/navigation/MainNavigator';
import AdminScreen from './src/admin/AdminScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [initialParams, setInitialParams] = useState(null);

  useEffect(() => {
    // Chủ động cho phép tất cả hướng xoay — hoạt động trên cả Android và iOS
    // unlockAsync() không đủ, phải dùng lockAsync(ALL) để Android mới nhận
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('logged_in_user');
        if (userDataString) {
          const user = JSON.parse(userDataString);
          setInitialParams({ user });
          
          if (user.role === 'ADMIN') {
            setInitialRoute('Admin');
          } else {
            setInitialRoute('Main');
          }
        }
      } catch (error) {
        console.log('Lỗi khi đọc AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainNavigator} initialParams={initialParams} />
        <Stack.Screen name="Admin" component={AdminScreen} initialParams={initialParams} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E0505',
  }
});
