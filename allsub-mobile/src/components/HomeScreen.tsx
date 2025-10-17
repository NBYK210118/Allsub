import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedToggle from './AnimatedToggle';
import SubtitleOverlay from './SubtitleOverlay';
import { useAppStore } from '../store/useAppStore';
import SubtitleService, { SubtitleServiceState } from '../services/subtitleService';

const HomeScreen: React.FC = () => {
  const { isCaptionEnabled, toggleCaption } = useAppStore();
  const [showStatusText, setShowStatusText] = useState(false);
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

  // Gradient 색상 전환 애니메이션
  useEffect(() => {
    Animated.timing(gradientOpacity, {
      toValue: isCaptionEnabled ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isCaptionEnabled, gradientOpacity]);

  // 자막 서비스 상태 관리
  useEffect(() => {
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
      // 자막 서비스 시작 (한국어 음성 인식 -> 영어 번역)
      SubtitleService.start(
        handleSubtitleUpdate, 
        handleStateUpdate,
        'demo-user-1',
        'ko-KR', // 소스 언어
        'en' // 타겟 언어 (영어)
      ).then(success => {
        if (success) {
          setShowSubtitleOverlay(true);
        } else {
          console.error('Failed to start subtitle service');
        }
      });
    } else {
      // 자막 서비스 중지
      SubtitleService.stop();
      setShowSubtitleOverlay(false);
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      SubtitleService.stop();
    };
  }, [isCaptionEnabled]);

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
    await toggleCaption();
    console.log('After toggle. isCaptionEnabled:', isCaptionEnabled);
    setShowStatusText(true);
  };

  return (
    <View style={styles.container}>
      {/* OFF 상태 Gradient (배경) */}
      <LinearGradient
        colors={['#9595A0', '#8A93FB', '#595D8B']}
        locations={[0.21, 0.81, 1.0]}
        style={styles.gradientContainer}
      />
      
      {/* ON 상태 Gradient (오버레이) */}
      <Animated.View style={[styles.gradientOverlay, { opacity: gradientOpacity }]}>
        <LinearGradient
          colors={['#363163', '#8A93FB', '#595D8B']}
          locations={[0.21, 0.81, 1.0]}
          style={styles.gradientContainer}
        />
      </Animated.View>

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
                  {isCaptionEnabled ? 'Turned On' : 'Turned Off'}
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

      {/* Subtitle Overlay */}
      <SubtitleOverlay
        isVisible={showSubtitleOverlay}
        subtitle={subtitleServiceState.currentSubtitle}
        translation={subtitleServiceState.currentTranslation}
        onClose={() => setShowSubtitleOverlay(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginTop: 90,
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
});

export default HomeScreen;
