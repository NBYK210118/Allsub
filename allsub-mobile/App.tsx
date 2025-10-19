import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Animated } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import LoadingScreen from './src/components/LoadingScreen';
import HomeScreen from './src/components/HomeScreen';

export default function App() {
  const { isLoading, setLoading, loadUserSettings } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  console.log('App: Component rendered, isLoading =', isLoading);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('App: Initializing...');
      try {
        // 사용자 설정 로드 (타임아웃 설정)
        const loadPromise = loadUserSettings();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);
        console.log('App: Settings loaded');
      } catch (error: any) {
        console.log('App: Failed to load settings, using defaults:', error?.message);
        // 에러가 나도 계속 진행 (오프라인 모드)
      } finally {
        // 최소 1.5초 로딩 화면 표시 후 fade out
        setTimeout(() => {
          console.log('App: Starting fade out animation');
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            console.log('App: Setting isLoading to false');
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
