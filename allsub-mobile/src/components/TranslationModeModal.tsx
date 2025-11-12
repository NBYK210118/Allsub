import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TranslationDirection } from '../store/useAppStore';

interface TranslationModeModalProps {
  isVisible: boolean;
  onClose: () => void;
  translationDirection: TranslationDirection;
  onDirectionChange: (direction: TranslationDirection) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TranslationModeModal: React.FC<TranslationModeModalProps> = ({
  isVisible,
  onClose,
  translationDirection,
  onDirectionChange,
}) => {
  const isKoToEn = translationDirection === 'ko-to-en';

  const handleDirectionChange = (direction: TranslationDirection) => {
    onDirectionChange(direction);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)']}
            style={styles.gradientBackground}
          >
            <View style={styles.header}>
              <Text style={styles.title}>번역 모드 설정</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.description}>
                음성 인식된 텍스트를 어떤 언어로 번역할지 선택하세요.
              </Text>

              <View style={styles.optionsContainer}>
                {/* 한글 → 영문 옵션 */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    isKoToEn && styles.optionButtonActive
                  ]}
                  onPress={() => handleDirectionChange('ko-to-en')}
                  activeOpacity={0.7}
                >
                  {isKoToEn && (
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.8)', 'rgba(124, 58, 237, 0.8)']}
                      style={styles.optionGradient}
                    />
                  )}
                  <View style={styles.optionContent}>
                    <Text style={styles.optionEmoji}>🇰🇷 → 🇺🇸</Text>
                    <Text style={[
                      styles.optionTitle,
                      isKoToEn && styles.optionTitleActive
                    ]}>
                      한글 → 영문
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      isKoToEn && styles.optionDescriptionActive
                    ]}>
                      한국어 음성을 영어로 번역
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 영문 → 한글 옵션 */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    !isKoToEn && styles.optionButtonActive
                  ]}
                  onPress={() => handleDirectionChange('en-to-ko')}
                  activeOpacity={0.7}
                >
                  {!isKoToEn && (
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.8)', 'rgba(124, 58, 237, 0.8)']}
                      style={styles.optionGradient}
                    />
                  )}
                  <View style={styles.optionContent}>
                    <Text style={styles.optionEmoji}>🇺🇸 → 🇰🇷</Text>
                    <Text style={[
                      styles.optionTitle,
                      !isKoToEn && styles.optionTitleActive
                    ]}>
                      영문 → 한글
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      !isKoToEn && styles.optionDescriptionActive
                    ]}>
                      영어 음성을 한국어로 번역
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBackground: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  optionButtonActive: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  optionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  optionContent: {
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  optionTitleActive: {
    color: 'white',
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  optionDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default TranslationModeModal;



