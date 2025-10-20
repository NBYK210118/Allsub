import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ENV_CONFIG, ALL_CONFIGS, API_BASE_URL, WS_BASE_URL } from '../config/environment';

/**
 * 디버그용 환경 설정 표시 컴포넌트
 * 개발 중에만 사용하세요!
 */
const DebugConfig: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!__DEV__) {
    // 프로덕션에서는 표시하지 않음
    return null;
  }

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.floatingButtonText}>⚙️</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 환경 설정 디버그</Text>
          <TouchableOpacity onPress={() => setIsVisible(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 현재 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 현재 사용 중인 설정</Text>
            <View style={styles.infoBox}>
              <InfoRow label="플랫폼" value={Platform.OS.toUpperCase()} />
              <InfoRow label="환경" value={__DEV__ ? 'Development' : 'Production'} />
              <InfoRow label="API URL" value={API_BASE_URL} />
              <InfoRow label="WebSocket URL" value={WS_BASE_URL} />
            </View>
          </View>

          {/* iOS 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍎 iOS 시뮬레이터 설정</Text>
            <View style={styles.infoBox}>
              <InfoRow label="API URL" value={ALL_CONFIGS.ios.apiBaseUrl} />
              <InfoRow label="WebSocket URL" value={ALL_CONFIGS.ios.wsBaseUrl} />
            </View>
          </View>

          {/* Android 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Android 에뮬레이터 설정</Text>
            <View style={styles.infoBox}>
              <InfoRow label="API URL" value={ALL_CONFIGS.android.apiBaseUrl} />
              <InfoRow label="WebSocket URL" value={ALL_CONFIGS.android.wsBaseUrl} />
            </View>
          </View>

          {/* 실제 디바이스 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📲 실제 디바이스 설정 (개발용)</Text>
            <View style={styles.infoBox}>
              <InfoRow label="API URL" value={ALL_CONFIGS.devDevice.apiBaseUrl} />
              <InfoRow label="WebSocket URL" value={ALL_CONFIGS.devDevice.wsBaseUrl} />
            </View>
            <Text style={styles.helpText}>
              💡 실제 디바이스에서 테스트하려면 src/config/environment.ts에서 DEV_DEVICE_CONFIG를 수정하세요.
            </Text>
          </View>

          {/* 프로덕션 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚀 프로덕션 설정</Text>
            <View style={styles.infoBox}>
              <InfoRow label="API URL" value={ALL_CONFIGS.production.apiBaseUrl} />
              <InfoRow label="WebSocket URL" value={ALL_CONFIGS.production.wsBaseUrl} />
            </View>
          </View>

          {/* 도움말 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 도움말</Text>
            <View style={styles.helpBox}>
              <Text style={styles.helpText}>
                • iOS 시뮬레이터: localhost 자동 사용{'\n'}
                • Android 에뮬레이터: 10.0.2.2 자동 사용{'\n'}
                • 실제 디바이스: WiFi IP 수동 설정 필요{'\n'}
                {'\n'}
                자세한 내용은 ENVIRONMENT_CONFIG.md 참고
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 55,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 24,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  helpBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  helpText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginTop: 8,
  },
});

export default DebugConfig;

