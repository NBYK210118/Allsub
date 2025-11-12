import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TranslationDirection } from '../store/useAppStore';

interface LanguageDirectionSelectorProps {
  translationDirection: TranslationDirection;
  onDirectionChange: (direction: TranslationDirection) => void;
  isSmallScreen?: boolean;
}

const LanguageDirectionSelector: React.FC<LanguageDirectionSelectorProps> = ({
  translationDirection,
  onDirectionChange,
  isSmallScreen = false,
}) => {
  const isKoToEn = translationDirection === 'ko-to-en';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSmallScreen && styles.containerSmall
      ]}
      onPress={() => onDirectionChange(isKoToEn ? 'en-to-ko' : 'ko-to-en')}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.optionText,
        isSmallScreen && styles.optionTextSmall
      ]}>
        {isKoToEn ? '🇰🇷 → 🇺🇸' : '🇺🇸 → 🇰🇷'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  containerSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  optionTextSmall: {
    fontSize: 14,
  },
});

export default LanguageDirectionSelector;
