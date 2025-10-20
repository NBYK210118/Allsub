import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedToggle from './AnimatedToggle';
import SubtitleOverlay from './SubtitleOverlay';
import FloatingButton from './FloatingButton';
import BackgroundNotice from './BackgroundNotice';
import DebugConfig from './DebugConfig';
import { useAppStore } from '../store/useAppStore';
import SubtitleService, { SubtitleServiceState } from '../services/subtitleService';

const HomeScreen: React.FC = () => {
  console.log('HomeScreen: Component rendering');
  
  const { isCaptionEnabled, toggleCaption } = useAppStore();
  const [showStatusText, setShowStatusText] = useState(false);
  const [statusMessage, setStatusMessage] = useState<'on' | 'off'>('off'); // 토글 후 상태를 저장
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [subtitleServiceState, setSubtitleServiceState] = useState<SubtitleServiceState>({
    isActive: false,
    currentSubtitle: '',
    currentTranslation: '',
    isRecording: false,
    isProcessing: false,
    isConnected: false,
  });
  const [showSubtitleOverlay, setShowSubtitleOverlay] = useState(false);
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const statusScale = useRef(new Animated.Value(0.8)).current;
  const gradientOpacity = useRef(new Animated.Value(isCaptionEnabled ? 1 : 0)).current;
  
  // 블롭(원형 그라디언트) 애니메이션 값
  const blob1X = useRef(new Animated.Value(0)).current;
  const blob1Y = useRef(new Animated.Value(0)).current;
  const blob1Scale = useRef(new Animated.Value(1)).current;
  const blob2X = useRef(new Animated.Value(0)).current;
  const blob2Y = useRef(new Animated.Value(0)).current;
  const blob2Scale = useRef(new Animated.Value(1)).current;
  const blob3X = useRef(new Animated.Value(0)).current;
  const blob3Y = useRef(new Animated.Value(0)).current;
  const blob3Scale = useRef(new Animated.Value(1)).current;

  // Gradient 색상 전환 애니메이션
  useEffect(() => {
    Animated.timing(gradientOpacity, {
      toValue: isCaptionEnabled ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isCaptionEnabled, gradientOpacity]);

  // 블롭 애니메이션 루프
  useEffect(() => {
    const makeBlobLoop = (
      x: Animated.Value,
      y: Animated.Value,
      s: Animated.Value,
      dx: number,
      dy: number,
      minScale: number,
      maxScale: number,
      duration: number,
      delay: number
    ) => {
      const move = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(x, { toValue: dx, duration, useNativeDriver: true }),
            Animated.timing(y, { toValue: dy, duration, useNativeDriver: true }),
            Animated.timing(s, { toValue: maxScale, duration, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(x, { toValue: -dx, duration, useNativeDriver: true }),
            Animated.timing(y, { toValue: -dy, duration, useNativeDriver: true }),
            Animated.timing(s, { toValue: minScale, duration, useNativeDriver: true }),
          ]),
        ])
      );
      move.start();
      return () => move.stop();
    };

    const stop1 = makeBlobLoop(blob1X, blob1Y, blob1Scale, 20, 12, 0.9, 1.05, 8000, 0);
    const stop2 = makeBlobLoop(blob2X, blob2Y, blob2Scale, 18, 18, 0.95, 1.1, 9000, 600);
    const stop3 = makeBlobLoop(blob3X, blob3Y, blob3Scale, 25, 14, 0.92, 1.08, 10000, 1200);

    return () => {
      stop1?.();
      stop2?.();
      stop3?.();
    };
  }, [blob1X, blob1Y, blob1Scale, blob2X, blob2Y, blob2Scale, blob3X, blob3Y, blob3Scale]);

  // 자막 서비스 상태 관리
  useEffect(() => {
    console.log('HomeScreen: isCaptionEnabled changed to', isCaptionEnabled);
    
    const handleSubtitleUpdate = (subtitle: string, translation: string) => {
      setSubtitleServiceState(prev => ({ 
        ...prev, 
        currentSubtitle: subtitle,
        currentTranslation: translation 
      }));
    };

    const handleStateUpdate = (state: SubtitleServiceState) => {
      setSubtitleServiceState(state);
    };

    if (isCaptionEnabled) {
      console.log('HomeScreen: Starting subtitle service');
      // 자막 서비스 시작 (한국어 음성 인식 -> 영어 번역)
      SubtitleService.start(
        handleSubtitleUpdate, 
        handleStateUpdate,
        'demo-user-1',
        'ko-KR', // 소스 언어
        'en' // 타겟 언어 (영어)
      ).then(success => {
        console.log('HomeScreen: Subtitle service start result:', success);
        if (!success) {
          console.error('HomeScreen: Failed to start subtitle service');
        }
      }).catch(error => {
        console.error('HomeScreen: Error starting subtitle service:', error);
      });
    } else {
      console.log('HomeScreen: Stopping subtitle service');
      // 자막 서비스 중지
      SubtitleService.stop();
      setShowSubtitleOverlay(false);
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      console.log('HomeScreen: Cleanup');
      SubtitleService.stop();
    };
  }, [isCaptionEnabled]);

  // 플로팅 버튼 클릭 핸들러
  const handleFloatingButtonPress = () => {
    setShowSubtitleOverlay(!showSubtitleOverlay);
  };

  useEffect(() => {
    if (showStatusText) {
      // 텍스트 나타나는 애니메이션
      Animated.parallel([
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(statusScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        // 텍스트 사라지는 애니메이션
        Animated.parallel([
          Animated.timing(statusOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(statusScale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowStatusText(false);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showStatusText, statusOpacity, statusScale]);

  const handleToggle = async () => {
    console.log('Before toggle. isCaptionEnabled:', isCaptionEnabled);
    const newState = !isCaptionEnabled; // 새로운 상태를 미리 계산
    setStatusMessage(newState ? 'on' : 'off'); // 새로운 상태를 메시지에 저장
    await toggleCaption();
    console.log('After toggle. New state should be:', newState);
    setShowStatusText(true);
  };

  // 블롭 트랜스폼 구성
  const blob1Transform = [{ translateX: blob1X }, { translateY: blob1Y }, { scale: blob1Scale }];
  const blob2Transform = [{ translateX: blob2X }, { translateY: blob2Y }, { scale: blob2Scale }];
  const blob3Transform = [{ translateX: blob3X }, { translateY: blob3Y }, { scale: blob3Scale }];

  return (
    <View style={styles.container}>
      {/* 최하단 배경 */}
      <LinearGradient
        colors={isCaptionEnabled ? ['#2a2438', '#3d3154', '#2a2438'] : ['#52525f', '#606075', '#52525f']}
        locations={[0.0, 0.5, 1.0]}
        style={styles.gradientContainer}
      />

      {/* 블롭 레이어 */}
      <View style={styles.blobsContainer} pointerEvents="none">
        {/* Blob 1 */}
        <Animated.View style={[styles.blob, styles.blob1, { transform: blob1Transform, opacity: 0.35 }]}
        >
          <LinearGradient
            colors={isCaptionEnabled ? ['#7C3AED', '#4F46E5'] : ['#A7A7B5', '#8A93FB']}
            locations={[0.1, 0.9]}
            style={styles.blobFill}
          />
        </Animated.View>

        {/* Blob 2 */}
        <Animated.View style={[styles.blob, styles.blob2, { transform: blob2Transform, opacity: 0.28 }]}
        >
          <LinearGradient
            colors={isCaptionEnabled ? ['#22D3EE', '#8B5CF6'] : ['#94A3B8', '#8A93FB']}
            locations={[0.0, 1.0]}
            style={styles.blobFill}
          />
        </Animated.View>

        {/* Blob 3 */}
        <Animated.View style={[styles.blob, styles.blob3, { transform: blob3Transform, opacity: 0.22 }]}
        >
          <LinearGradient
            colors={isCaptionEnabled ? ['#F472B6', '#60A5FA'] : ['#B0B0C0', '#8A93FB']}
            locations={[0.0, 1.0]}
            style={styles.blobFill}
          />
        </Animated.View>
      </View>

      {/* Background Notice */}
      <BackgroundNotice isServiceActive={isCaptionEnabled} />

      {/* Content */}
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/bear-logo.png')} 
              style={styles.bearIcon}
              resizeMode="contain"
            />
            <Text style={styles.appName}>AllSub</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <AnimatedToggle isEnabled={isCaptionEnabled} onToggle={handleToggle} />
          
          {/* iOS Live Activities 안내 */}
          {Platform.OS === 'ios' && (
            <View style={styles.liveActivityNotice}>
              <Text style={styles.liveActivityIcon}>
                {isCaptionEnabled ? '🏝️' : '⏸️'}
              </Text>
              <View style={styles.liveActivityTextContainer}>
                <Text style={styles.liveActivityTitle}>
                  {isCaptionEnabled ? 'Live Activities 활성화됨' : 'Live Activities 비활성화됨'}
                </Text>
                <Text style={styles.liveActivityDescription}>
                  {isCaptionEnabled 
                    ? 'YouTube Premium 백그라운드 재생 시\nDynamic Island와 잠금 화면에서 자막을 확인하세요!'
                    : '자막 서비스를 켜면 Live Activities가\nDynamic Island와 잠금 화면에 표시됩니다.'
                  }
                </Text>
              </View>
            </View>
          )}

          {/* Android 시스템 오버레이 안내 */}
          {Platform.OS === 'android' && (
            <View style={styles.liveActivityNotice}>
              <Text style={styles.liveActivityIcon}>
                {isCaptionEnabled ? '💬' : '⏸️'}
              </Text>
              <View style={styles.liveActivityTextContainer}>
                <Text style={styles.liveActivityTitle}>
                  {isCaptionEnabled ? '자막 서비스 활성화됨' : '자막 서비스 비활성화됨'}
                </Text>
                <Text style={styles.liveActivityDescription}>
                  {isCaptionEnabled 
                    ? '플로팅 버튼을 터치하면\n언제든지 실시간 자막을 확인할 수 있습니다!'
                    : '자막 서비스를 켜면\n다른 앱 사용 중에도 자막을 볼 수 있습니다.'
                  }
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Status Message Container - Bottom Area */}
        <View style={styles.statusMessageContainer}>
          {showStatusText && (
            <Animated.View
              style={[
                styles.statusModal,
                {
                  opacity: statusOpacity,
                  transform: [{ scale: statusScale }],
                },
              ]}
            >
              <View style={styles.statusButtonInner}>
                <Text style={styles.statusText}>
                  {statusMessage === 'on' ? 'Turned On' : 'Turned Off'}
                </Text>
                <Text style={styles.statusIcon}>✕</Text>
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                // TODO: Support 기능 구현
                console.log('Support pressed');
              }}
            >
              <Text style={styles.menuItemText}>Support</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowShareModal(true);
              }}
            >
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity 
          style={styles.shareModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.shareModal}>
            <Text style={styles.shareTitle}>Share to</Text>
            
            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => {
                  setShowShareModal(false);
                  console.log('Share to X');
                  // TODO: X 공유 구현
                }}
              >
                <View style={styles.shareIconContainer}>
                  <Text style={styles.shareIcon}>𝕏</Text>
                </View>
                <Text style={styles.shareOptionText}>X</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => {
                  setShowShareModal(false);
                  console.log('Share to Instagram');
                  // TODO: Instagram 공유 구현
                }}
              >
                <View style={styles.shareIconContainer}>
                  <Text style={styles.shareIcon}>📷</Text>
                </View>
                <Text style={styles.shareOptionText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => {
                  setShowShareModal(false);
                  console.log('Share to Facebook');
                  // TODO: Facebook 공유 구현
                }}
              >
                <View style={styles.shareIconContainer}>
                  <Text style={styles.shareIcon}>f</Text>
                </View>
                <Text style={styles.shareOptionText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Button */}
      <FloatingButton
        isVisible={isCaptionEnabled}
        onPress={handleFloatingButtonPress}
        isExpanded={showSubtitleOverlay}
      />

      {/* Subtitle Overlay */}
      <SubtitleOverlay
        isVisible={showSubtitleOverlay}
        subtitle={subtitleServiceState.currentSubtitle}
        translation={subtitleServiceState.currentTranslation}
        onClose={() => setShowSubtitleOverlay(false)}
      />

      {/* Debug Config (개발 모드에서만 표시) */}
      <DebugConfig />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    filter: 'blur(18px)',
  },
  blob1: {
    top: -60,
    left: -40,
  },
  blob2: {
    bottom: -80,
    right: -40,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  blob3: {
    top: '35%',
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  blobFill: {
    flex: 1,
    borderRadius: 1000,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  depthContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  depthLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  depthLayer1: {
    top: 0,
    height: '50%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  depthLayer2: {
    top: '20%',
    height: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  depthLayer3: {
    top: '40%',
    height: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 30,
  },
  shadowWrapper: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  layerGradient: {
    flex: 1,
    opacity: 0.8,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bearIcon: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  menuButton: {
    padding: 8,
  },
  menuLine: {
    width: 30,
    height: 4,
    backgroundColor: 'white',
    marginVertical: 2,
  },
  mainContent: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 180,
  },
  statusMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    minHeight: 150,
  },
  statusModal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  statusIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 95,
    paddingRight: 20,
  },
  menuModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  shareOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  shareOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  liveActivityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 100,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  liveActivityIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  liveActivityTextContainer: {
    flex: 1,
  },
  liveActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  liveActivityDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
});

export default HomeScreen;
