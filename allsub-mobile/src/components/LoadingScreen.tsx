import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen: React.FC = () => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 로고 애니메이션 (0.5초 후 시작)
    const logoAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    // 텍스트 애니메이션 (1초 후 시작)
    const textAnimation = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(textScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // 순차적으로 실행
    setTimeout(() => {
      logoAnimation.start();
    }, 500);

    setTimeout(() => {
      textAnimation.start();
    }, 1000);
  }, [logoOpacity, logoScale, textOpacity, textScale]);

  return (
    <LinearGradient
      colors={['#6B46C1', '#A855F7', '#C084FC']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Animated.View 
          style={[
            styles.logoCircle,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image 
            source={require('../../assets/bear-logo.png')} 
            style={styles.bearLogo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text 
          style={[
            styles.appName,
            {
              opacity: textOpacity,
              transform: [{ scale: textScale }],
            },
          ]}
        >
          AllSub
        </Animated.Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bearLogo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LoadingScreen;
