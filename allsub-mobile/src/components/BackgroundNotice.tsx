import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundNoticeProps {
  isServiceActive: boolean;
}

const BackgroundNotice: React.FC<BackgroundNoticeProps> = ({ isServiceActive }) => {
  const [isBackground, setIsBackground] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsBackground(true);
      } else if (nextAppState === 'active') {
        setIsBackground(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isServiceActive && isBackground) {
      // Show notice
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
    }
  }, [isServiceActive, isBackground]);

  if (!isServiceActive || !isBackground) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.95)', 'rgba(124, 58, 237, 0.95)']}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <View style={styles.pulseCircle} />
          <Text style={styles.icon}>🎙️</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>AllSub이 백그라운드에서 실행 중</Text>
          <Text style={styles.subtitle}>계속해서 자막을 생성하고 있습니다</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 2000,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pulseCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
});

export default BackgroundNotice;

