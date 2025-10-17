import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Animated } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import LoadingScreen from './src/components/LoadingScreen';
import HomeScreen from './src/components/HomeScreen';

export default function App() {
  const { isLoading, setLoading, loadUserSettings } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 사용자 설정 로드
        await loadUserSettings();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        // 최소 1.5초 로딩 화면 표시 후 fade out
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setLoading(false);
          });
        }, 1500);
      }
    };

    initializeApp();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <LoadingScreen />
        </Animated.View>
      ) : (
        <HomeScreen />
      )}
      <StatusBar style="light" />
    </View>
  );
}
