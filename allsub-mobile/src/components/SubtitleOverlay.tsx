import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback, Image, ScrollView, TouchableOpacity, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SpeechRecognitionResult } from '../services/speechService';
import { MicrophoneMode } from '../store/useAppStore';

interface SubtitleItem {
  id: string;
  original: string;
  translated: string;
  timestamp: number;
}

interface SubtitleOverlayProps {
  isVisible: boolean;
  subtitle: string;
  translation?: string;
  onClose: () => void;
  microphoneMode?: MicrophoneMode;
  onMicrophoneModeChange?: (mode: MicrophoneMode) => void;
  isPushToTalkActive?: boolean;
  onPushToTalkChange?: (active: boolean) => void;
  translationDirection?: 'ko-to-en' | 'en-to-ko';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MAX_HISTORY = 3; // 최대 3개 자막 히스토리 유지

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ 
  isVisible, 
  subtitle,
  translation, 
  onClose,
  microphoneMode,
  onMicrophoneModeChange,
  isPushToTalkActive,
  onPushToTalkChange,
  translationDirection = 'ko-to-en'
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [subtitleHistory, setSubtitleHistory] = useState<SubtitleItem[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 드래그 기능을 위한 상태 (자유로운 위치 이동)
  const [pan] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
  const overlayHeight = screenHeight * 0.75; // 오버레이 높이 (75%)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // 헤더 영역에서만 드래그 시작 (상단 100px)
        return evt.nativeEvent.locationY < 100;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        // 화면 밖으로 나가지 않도록 제한
        const finalX = Math.max(-screenWidth * 0.3, Math.min(screenWidth * 0.3, (pan.x as any)._value));
        const finalY = Math.max(-screenHeight * 0.4, Math.min(screenHeight * 0.2, (pan.y as any)._value));
        
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // 새 자막이 오면 히스토리에 추가
  useEffect(() => {
    console.log('SubtitleOverlay: subtitle 업데이트 -', subtitle, '/', translation);
    if (subtitle && subtitle.trim()) {
      console.log('SubtitleOverlay: 히스토리에 추가 중...');
      setSubtitleHistory(prev => {
        // 중복 체크 (같은 자막이면 무시)
        if (prev.length > 0 && prev[prev.length - 1].original === subtitle) {
          console.log('SubtitleOverlay: 중복 자막 무시');
          return prev;
        }
        
        // 새 자막 추가
        const newItem: SubtitleItem = {
          id: Date.now().toString(),
          original: subtitle,
          translated: translation || '',
          timestamp: Date.now(),
        };
        
        console.log('SubtitleOverlay: 새 자막 추가 -', newItem);
        
        // 최대 개수 유지 (오래된 것부터 제거)
        const updated = [...prev, newItem];
        if (updated.length > MAX_HISTORY) {
          return updated.slice(-MAX_HISTORY);
        }
        return updated;
      });
      
      // 새 자막이 오면 자동 스크롤
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [subtitle, translation]);

  // 오버레이 표시/숨김 애니메이션
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // 오버레이가 숨겨지면 히스토리 초기화
      setTimeout(() => {
        setSubtitleHistory([]);
      }, 250);
    }
  }, [isVisible, fadeAnim, slideAnim]);

  if (!isVisible) return null;

  console.log('SubtitleOverlay: 렌더링 - 히스토리 개수:', subtitleHistory.length);

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* 배경 블러 레이어 */}
      <BlurView
        intensity={20}
        tint="dark"
        style={styles.blurBackground}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backgroundTouchArea} />
        </TouchableWithoutFeedback>
      </BlurView>
      
      {/* 자막 컨텐츠 영역 */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          }
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradientBackground}
        >
          {/* 드래그 핸들 표시 */}
          <View style={styles.dragHandle}>
            <View style={styles.dragHandleBar} />
          </View>
          
          <TouchableWithoutFeedback>
            <View style={styles.subtitleContainer}>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../../assets/bear-logo.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.appName}>AllSub</Text>
                </View>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>LIVE</Text>
                </View>
              </View>
              
              {/* 자막 영역 (스크롤 가능) */}
              <View style={styles.subtitleScrollWrapper}>
                <ScrollView 
                  ref={scrollViewRef}
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {subtitleHistory.length === 0 && (
                    <View style={styles.subtitleBox}>
                      <Text style={styles.placeholderText}>
                        음성을 인식하고 있습니다...
                      </Text>
                    </View>
                  )}
                  
                {subtitleHistory.map((item, index) => {
                  const isLatest = index === subtitleHistory.length - 1;
                  
                  // 최신 자막에만 fade-in 애니메이션 적용
                  const SubtitleItem = ({ children }: { children: React.ReactNode }) => {
                    const [itemFadeAnim] = useState(new Animated.Value(isLatest ? 0 : 1));
                    
                    useEffect(() => {
                      if (isLatest) {
                        Animated.timing(itemFadeAnim, {
                          toValue: 1,
                          duration: 150,
                          useNativeDriver: true,
                        }).start();
                      }
                    }, []);
                    
                    return (
                      <Animated.View
                        style={[
                          styles.subtitleBox,
                          isLatest ? styles.currentSubtitleBox : styles.historySubtitleBox,
                          { opacity: itemFadeAnim }
                        ]}
                      >
                        {children}
                      </Animated.View>
                    );
                  };
                  
                  return (
                    <SubtitleItem key={item.id}>
                      {/* 번역 방향에 따라 표시 순서 변경 */}
                      {translationDirection === 'ko-to-en' ? (
                        // 한글 → 영어: 영어(번역)를 위에, 한글(원본)을 아래에
                        <>
                          {item.translated && item.translated !== item.original && (
                            <Text style={isLatest ? styles.translationText : styles.historyTranslationText}>
                              {item.translated}
                            </Text>
                          )}
                          <Text style={isLatest ? styles.subtitleText : styles.historySubtitleText}>
                            {item.original}
                          </Text>
                        </>
                      ) : (
                        // 영어 → 한글: 한글(번역)을 위에, 영어(원본)을 아래에
                        <>
                          {item.translated && item.translated !== item.original && (
                            <Text style={isLatest ? styles.translationText : styles.historyTranslationText}>
                              {item.translated}
                            </Text>
                          )}
                          <Text style={isLatest ? styles.subtitleText : styles.historySubtitleText}>
                            {item.original}
                          </Text>
                        </>
                      )}
                    </SubtitleItem>
                  );
                })}
                </ScrollView>
              </View>

              {/* 하단 컨트롤 영역 */}
              <View style={styles.bottomControlsContainer}>
                {/* 모드 전환 버튼 */}
                <TouchableOpacity
                  style={styles.modeToggleButton}
                  onPress={() => onMicrophoneModeChange?.(microphoneMode === 'auto' ? 'push-to-talk' : 'auto')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={microphoneMode === 'auto' ? "radio-button-on" : "hand-left"} 
                    size={28} 
                    color="white" 
                  />
                  <Text style={styles.modeToggleText}>
                    {microphoneMode === 'auto' ? '자동' : '수동'}
                  </Text>
                </TouchableOpacity>

                {/* Push-to-Talk 버튼 (중앙) */}
                <TouchableOpacity
                  style={[
                    styles.pushToTalkButton,
                    isPushToTalkActive && styles.pushToTalkButtonActive
                  ]}
                  onPressIn={() => onPushToTalkChange?.(true)}
                  onPressOut={() => onPushToTalkChange?.(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={isPushToTalkActive ? "mic" : "mic-outline"} 
                    size={40} 
                    color="white" 
                  />
                </TouchableOpacity>

                {/* 공간 균형을 위한 투명 요소 */}
                <View style={styles.modeToggleButton} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundTouchArea: {
    flex: 1,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    height: screenHeight * 0.75, // 화면의 75% (1.5배 증가)
    borderRadius: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: 12,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 20,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120, // Push-to-Talk 버튼 공간 확보
    flex: 1,
  },
  subtitleScrollWrapper: {
    flex: 1,
    maxHeight: screenHeight * 0.55, // 화면의 55% (더 많은 자막 표시)
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  microphoneControl: {
    alignItems: 'center',
  },
  microphoneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  microphoneButtonActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  microphoneIcon: {
    fontSize: 18,
  },
  microphoneLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  modeToggleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleText: {
    fontSize: 9,
    color: 'white',
    marginTop: 2,
    fontWeight: '600',
  },
  pushToTalkContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushToTalkButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pushToTalkButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 1.1 }],
  },
  pushToTalkContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushToTalkIcon: {
    fontSize: 36,
  },
  pushToTalkText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginTop: 4,
  },
  logoImage: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtitleBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  currentSubtitleBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)', // 현재 자막은 보라색 강조
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderWidth: 2,
  },
  historySubtitleBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 이전 자막은 더 투명하게
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  subtitleText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  translationText: {
    color: '#A0AEC0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  placeholderText: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  historySubtitleText: {
    color: 'rgba(255, 255, 255, 0.6)', // 이전 자막은 반투명
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 4,
  },
  historyTranslationText: {
    color: 'rgba(160, 174, 192, 0.5)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
  },
});

export default SubtitleOverlay;
