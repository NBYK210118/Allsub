import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface AnimatedToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const AnimatedToggle: React.FC<AnimatedToggleProps> = ({ isEnabled, onToggle }) => {
  const translateY = useRef(new Animated.Value(isEnabled ? 1 : 0)).current;
  const gradientOpacity = useRef(new Animated.Value(isEnabled ? 1 : 0)).current;
  const solidOpacity = useRef(new Animated.Value(isEnabled ? 0 : 1)).current;

  useEffect(() => {
    console.log('AnimatedToggle: isEnabled changed to', isEnabled);
    
    // 애니메이션 중복 실행 방지
    translateY.stopAnimation();
    gradientOpacity.stopAnimation();
    solidOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isEnabled ? 1 : 0,
        duration: 250, // 500ms -> 250ms (더 빠른 반응)
        useNativeDriver: true,
      }),
      Animated.timing(gradientOpacity, {
        toValue: isEnabled ? 1 : 0,
        duration: 200, // 300ms -> 200ms
        useNativeDriver: true,
      }),
      Animated.timing(solidOpacity, {
        toValue: isEnabled ? 0 : 1,
        duration: 200, // 300ms -> 200ms
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Animation completed. isEnabled:', isEnabled);
    });
  }, [isEnabled]);

  const knobTranslateY = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [60, -60], // OFF일 때 아래(60px), ON일 때 위(-60px)
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.trackWrapper}>
          {/* Track Background - Gradient (ON state) */}
          <Animated.View style={[styles.trackGradientWrapper, { opacity: gradientOpacity }]}>
            <LinearGradient
              colors={['#363163', '#C88AF8', '#513865']}
              locations={[0.43, 0.76, 0.95]}
              style={styles.track}
            />
          </Animated.View>
          
          {/* Track Background - Solid with Blur (OFF state) */}
          <Animated.View style={[styles.track, { opacity: solidOpacity }]}>
            <BlurView intensity={40} style={styles.blurView} tint="light">
              <View style={styles.trackBackgroundOverlay} />
            </BlurView>
          </Animated.View>
          
          {/* Knob Shadow Wrapper */}
          <Animated.View style={[styles.knobShadowWrapper, { transform: [{ translateY: knobTranslateY }] }]}>
            <View style={styles.knob}>
              {/* Knob Gradient (ON state) */}
              <Animated.View style={[styles.knobGradientWrapper, { opacity: gradientOpacity }]}>
                <LinearGradient
                  colors={['#7F2F93', '#57335F', '#A251B7']}
                  locations={[0.7, 1.0, 1.0]}
                  style={styles.knobGradient}
                />
              </Animated.View>
              
              {/* Knob Solid (OFF state) */}
              <Animated.View style={[styles.knobSolid, { opacity: solidOpacity }]} />
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  trackWrapper: {
    width: 120,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trackGradientWrapper: {
    position: 'absolute',
    width: 120,
    height: 240,
    borderRadius: 60,
  },
  track: {
    position: 'absolute',
    width: 120,
    height: 240,
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  blurView: {
    width: '100%',
    height: '100%',
  },
  trackBackgroundOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(229, 231, 235, 0.6)',
  },
  knobShadowWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  knob: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  knobGradientWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  knobGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  knobSolid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: 'white',
  },
});

export default AnimatedToggle;